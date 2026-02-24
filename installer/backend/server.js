import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiReference } from '@scalar/express-api-reference';
import swaggerSpec from './config/swagger.js';
import apiRoutes from './routes/index.js';
import { initializeWebSocket } from './websocket/handler.js';
import { initializeState } from './state/manager.js';
import { checkEnvironment } from './utils/error-handler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

initializeState();
checkEnvironment();

app.set('io', io);

app.get('/api-docs/openapi.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', apiReference({
  spec: { content: swaggerSpec },
  theme: 'kepler',
  pageTitle: 'Ascendra Installer API Docs'
}));

app.use('/api', apiRoutes);

/**
 * @openapi
 * /health:
 *   servers:
 *     - url: /
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns server health status and current timestamp.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initializeWebSocket(io);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Ascendra Installer Backend-for-Frontend                ║
║   Server running on http://localhost:${PORT}              ║
║   WebSocket ready on ws://localhost:${PORT}               ║
║   API Docs at http://localhost:${PORT}/api-docs           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, io };
