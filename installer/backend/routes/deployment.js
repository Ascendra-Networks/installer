import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllDeployments, getDeployment, saveDeployment, deleteDeployment } from '../state/manager.js';
import { asyncErrorHandler, validateDeploymentId, validateDeploymentConfig } from '../utils/error-handler.js';

const router = express.Router();

/**
 * @openapi
 * /deployment/list:
 *   get:
 *     tags: [Deployment]
 *     summary: List all deployments
 *     description: Returns all deployments stored in the system.
 *     responses:
 *       200:
 *         description: Array of deployment objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deployment'
 */
router.get('/list', (req, res) => {
  const deployments = getAllDeployments();
  res.json(Object.values(deployments));
});

/**
 * @openapi
 * /deployment/create:
 *   post:
 *     tags: [Deployment]
 *     summary: Create a new deployment
 *     description: Creates a new deployment record with pending status. Use the WebSocket interface to start execution.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cloudProvider, clusterConfig]
 *             properties:
 *               cloudProvider:
 *                 type: string
 *                 enum: [aws, azure, gcp, on-premise]
 *               clusterConfig:
 *                 type: object
 *                 description: Cluster configuration (provider-specific)
 *               selectedComponents:
 *                 type: object
 *                 description: Components to install (optional)
 *     responses:
 *       201:
 *         description: Deployment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deployment'
 *       400:
 *         description: Invalid deployment configuration
 */
router.post('/create', asyncErrorHandler(async (req, res) => {
  const { cloudProvider, clusterConfig, onPremiseConfig, selectedComponents } = req.body;

  validateDeploymentConfig(req.body);

  const deploymentId = uuidv4();
  const deployment = {
    id: deploymentId,
    status: 'pending',
    cloudProvider,
    clusterConfig,
    onPremiseConfig: onPremiseConfig || null,
    selectedComponents: selectedComponents || {},
    phases: {
      terraform: {
        status: 'pending',
        progress: 0,
        outputs: {}
      },
      ansible: {
        status: 'pending',
        progress: 0,
        currentPhase: null
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveDeployment(deploymentId, deployment);

  console.log(`[API] Created deployment: ${deploymentId}`);
  res.status(201).json(deployment);
}));

/**
 * @openapi
 * /deployment/{id}:
 *   get:
 *     tags: [Deployment]
 *     summary: Get a deployment by ID
 *     description: Returns a single deployment with full status, phase details, and configuration.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Deployment UUID
 *     responses:
 *       200:
 *         description: Deployment object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deployment'
 *       404:
 *         description: Deployment not found
 *   delete:
 *     tags: [Deployment]
 *     summary: Delete a deployment
 *     description: Deletes a deployment record. Cannot delete a deployment that is currently running.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Deployment UUID
 *     responses:
 *       204:
 *         description: Deployment deleted
 *       400:
 *         description: Cannot delete running deployment
 *       404:
 *         description: Deployment not found
 */
router.get('/:id', asyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  validateDeploymentId(id);

  const deployment = getDeployment(id);

  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  res.json(deployment);
}));

/**
 * @openapi
 * /deployment/{id}/config:
 *   get:
 *     tags: [Deployment]
 *     summary: Get deployment configuration
 *     description: Returns only the configuration portion of a deployment (provider, cluster config, components).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Deployment UUID
 *     responses:
 *       200:
 *         description: Deployment configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cloudProvider:
 *                   type: string
 *                 clusterConfig:
 *                   type: object
 *                 selectedComponents:
 *                   type: object
 *       404:
 *         description: Deployment not found
 */
router.get('/:id/config', (req, res) => {
  const { id } = req.params;
  const deployment = getDeployment(id);

  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  res.json({
    cloudProvider: deployment.cloudProvider,
    clusterConfig: deployment.clusterConfig,
    selectedComponents: deployment.selectedComponents
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const deployment = getDeployment(id);

  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  if (deployment.status === 'running') {
    return res.status(400).json({ error: 'Cannot delete running deployment' });
  }

  deleteDeployment(id);
  res.status(204).send();
});

export default router;
