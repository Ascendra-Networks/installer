import { getDeployment } from '../state/manager.js';
import { executeDeployment, installComponents, cancelDeployment, triggerManualRetry } from '../services/deployment.service.js';

// Store active socket connections per deployment
const deploymentSockets = new Map();

/**
 * Initialize WebSocket handlers
 */
function initializeWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join deployment room
    socket.on('deployment:join', (deploymentId) => {
      console.log(`[WebSocket] Client ${socket.id} joining deployment: ${deploymentId}`);
      socket.join(`deployment:${deploymentId}`);
      
      // Store socket reference for this deployment
      if (!deploymentSockets.has(deploymentId)) {
        deploymentSockets.set(deploymentId, new Set());
      }
      deploymentSockets.get(deploymentId).add(socket.id);

      // Send current deployment state
      const deployment = getDeployment(deploymentId);
      if (deployment) {
        socket.emit('deployment:state', deployment);
      }
    });

    // Leave deployment room
    socket.on('deployment:leave', (deploymentId) => {
      console.log(`[WebSocket] Client ${socket.id} leaving deployment: ${deploymentId}`);
      socket.leave(`deployment:${deploymentId}`);
      
      if (deploymentSockets.has(deploymentId)) {
        deploymentSockets.get(deploymentId).delete(socket.id);
        if (deploymentSockets.get(deploymentId).size === 0) {
          deploymentSockets.delete(deploymentId);
        }
      }
    });

    // Start deployment
    socket.on('deployment:start', async (deploymentId) => {
      console.log(`[WebSocket] Starting deployment: ${deploymentId}`);
      try {
        await executeDeployment(deploymentId, io);
      } catch (error) {
        console.error(`[WebSocket] Error starting deployment ${deploymentId}:`, error);
        socket.emit('deployment:error', {
          deploymentId,
          error: error.message
        });
      }
    });

    // Retry a specific sub-step
    socket.on('deployment:retry', ({ deploymentId, subStepId }) => {
      console.log(`[WebSocket] Retry requested for deployment ${deploymentId}, sub-step: ${subStepId}`);
      const triggered = triggerManualRetry(deploymentId, subStepId);
      if (!triggered) {
        socket.emit('deployment:error', {
          deploymentId,
          error: `No pending retry found for sub-step ${subStepId}`
        });
      }
    });

    // Install additional components (step 5)
    socket.on('deployment:install-components', async ({ deploymentId, selectedComponents }) => {
      console.log(`[WebSocket] Installing components for deployment: ${deploymentId}`, selectedComponents);
      try {
        await installComponents(deploymentId, selectedComponents, io);
      } catch (error) {
        console.error(`[WebSocket] Error installing components for ${deploymentId}:`, error);
        socket.emit('installation:failed', {
          deploymentId,
          error: error.message
        });
      }
    });

    // Cancel deployment
    socket.on('deployment:cancel', async (deploymentId) => {
      console.log(`[WebSocket] Canceling deployment: ${deploymentId}`);
      try {
        await cancelDeployment(deploymentId);
        io.to(`deployment:${deploymentId}`).emit('deployment:cancelled', {
          deploymentId,
          message: 'Deployment cancelled by user'
        });
      } catch (error) {
        console.error(`[WebSocket] Error canceling deployment ${deploymentId}:`, error);
        socket.emit('deployment:error', {
          deploymentId,
          error: error.message
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      
      // Clean up socket references
      for (const [deploymentId, sockets] of deploymentSockets.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            deploymentSockets.delete(deploymentId);
          }
        }
      }
    });
  });

  console.log('[WebSocket] Handler initialized');
}

/**
 * Emit progress update to all clients watching a deployment
 */
function emitProgress(io, deploymentId, progressData) {
  io.to(`deployment:${deploymentId}`).emit('deployment:progress', {
    deploymentId,
    ...progressData
  });
}

/**
 * Emit raw output to all clients watching a deployment
 */
function emitOutput(io, deploymentId, type, output) {
  io.to(`deployment:${deploymentId}`).emit(`deployment:${type}:output`, {
    deploymentId,
    output
  });
}

/**
 * Emit completion event
 */
function emitCompleted(io, deploymentId, data = {}) {
  io.to(`deployment:${deploymentId}`).emit('deployment:completed', {
    deploymentId,
    ...data
  });
}

/**
 * Emit failure event
 */
function emitFailed(io, deploymentId, error) {
  io.to(`deployment:${deploymentId}`).emit('deployment:failed', {
    deploymentId,
    error: error.message || 'Deployment failed'
  });
}

export {
  initializeWebSocket,
  emitProgress,
  emitOutput,
  emitCompleted,
  emitFailed
};


