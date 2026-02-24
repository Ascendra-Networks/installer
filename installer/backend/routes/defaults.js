import express from 'express';
import defaultsService from '../services/defaults.service.js';

const router = express.Router();

/**
 * @openapi
 * /defaults:
 *   get:
 *     tags: [Defaults]
 *     summary: Get all cluster defaults
 *     description: Returns the full set of cluster configuration defaults shared between the UI and Terraform.
 *     responses:
 *       200:
 *         description: Cluster defaults object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Failed to load defaults
 */
router.get('/', (req, res) => {
  try {
    const defaults = defaultsService.getAll();
    res.json(defaults);
  } catch (error) {
    console.error('[API] Failed to get defaults:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /defaults/network:
 *   get:
 *     tags: [Defaults]
 *     summary: Get network defaults
 *     description: Returns VPC and subnet default configuration values.
 *     responses:
 *       200:
 *         description: Network defaults
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vpc:
 *                   type: object
 *                   properties:
 *                     cidr:
 *                       type: string
 *                       example: 10.0.0.0/16
 *                     nameSuffix:
 *                       type: string
 *                       example: -vpc
 *                 subnet:
 *                   type: object
 *                   properties:
 *                     cidr:
 *                       type: string
 *                       example: 10.0.1.0/24
 *                     nameSuffix:
 *                       type: string
 *                       example: -subnet
 *       500:
 *         description: Failed to load network defaults
 */
router.get('/network', (req, res) => {
  try {
    const defaults = defaultsService.getNetworkDefaults();
    res.json(defaults);
  } catch (error) {
    console.error('[API] Failed to get network defaults:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /defaults/reload:
 *   post:
 *     tags: [Defaults]
 *     summary: Reload defaults from config file
 *     description: Reloads cluster defaults from the config/cluster-defaults.json file.
 *     responses:
 *       200:
 *         description: Defaults reloaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to reload defaults
 */
router.post('/reload', (req, res) => {
  try {
    defaultsService.reload();
    res.json({ message: 'Defaults reloaded successfully' });
  } catch (error) {
    console.error('[API] Failed to reload defaults:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
