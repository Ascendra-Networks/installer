import express from 'express';
import { CLOUD_PROVIDERS } from '../services/mock-data.js';
import awsRoutes from './aws.js';
import onpremiseRoutes from './onpremise.js';
import deploymentRoutes from './deployment.js';
import defaultsRoutes from './defaults.js';
import wizardRoutes from './wizard.js';

const router = express.Router();

/**
 * @openapi
 * /providers:
 *   get:
 *     tags: [Defaults]
 *     summary: List cloud providers
 *     description: Returns the list of supported cloud providers (AWS, Azure, GCP, On-Premise).
 *     responses:
 *       200:
 *         description: Array of provider options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: aws
 *                   name:
 *                     type: string
 *                     example: Amazon Web Services
 *                   description:
 *                     type: string
 *                   regions:
 *                     type: array
 *                     items:
 *                       type: object
 */
router.get('/providers', (req, res) => {
  res.json(CLOUD_PROVIDERS);
});

router.use('/aws', awsRoutes);
router.use('/onpremise', onpremiseRoutes);
router.use('/deployment', deploymentRoutes);
router.use('/defaults', defaultsRoutes);
router.use('/wizard', wizardRoutes);

export default router;
