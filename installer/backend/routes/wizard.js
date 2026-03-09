import express from 'express';
import { getWizardState, saveWizardState, clearWizardState, getDeployment } from '../state/manager.js';
import { asyncErrorHandler } from '../utils/error-handler.js';
import { generateAnsibleVars, writeAnsibleVars } from '../services/config-generator.service.js';

const router = express.Router();

/**
 * @openapi
 * /wizard/state:
 *   get:
 *     tags: [Wizard]
 *     summary: Get saved wizard session state
 *     description: Returns the persisted wizard state so the UI can restore after a page refresh.
 *     responses:
 *       200:
 *         description: Wizard state (or null if none saved)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 *   post:
 *     tags: [Wizard]
 *     summary: Save wizard session state
 *     description: Persists the current wizard state to disk.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: State saved
 *   delete:
 *     tags: [Wizard]
 *     summary: Clear wizard session state
 *     description: Removes persisted wizard state (e.g. on wizard reset).
 *     responses:
 *       204:
 *         description: State cleared
 */
router.get('/state', (req, res) => {
  const state = getWizardState();

  if (!state) {
    return res.json(null);
  }

  if (state.deploymentId) {
    const deployment = getDeployment(state.deploymentId);
    if (deployment) {
      state.deploymentStatus = deployment.status;
    }
  }

  res.json(state);
});

router.post('/state', asyncErrorHandler(async (req, res) => {
  const wizardState = req.body;
  const saved = saveWizardState(wizardState);
  res.json({ success: true, savedAt: saved.savedAt });
}));

router.delete('/state', (req, res) => {
  clearWizardState();
  res.status(204).send();
});

/**
 * @openapi
 * /wizard/ansible-config:
 *   post:
 *     tags: [Wizard]
 *     summary: Write Ansible vars to all.yml immediately
 *     description: Generates and writes ansible/group_vars/all.yml from the current wizard config without starting a deployment. Called whenever proxy settings change in the UI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cloudProvider:
 *                 type: string
 *               clusterConfig:
 *                 type: object
 *               onPremiseConfig:
 *                 type: object
 *               selectedComponents:
 *                 type: object
 *     responses:
 *       200:
 *         description: Config written successfully
 */
router.post('/ansible-config', asyncErrorHandler(async (req, res) => {
  const { cloudProvider, clusterConfig, onPremiseConfig, selectedComponents } = req.body;

  const proxyConfig = clusterConfig?.proxyConfig || onPremiseConfig?.proxyConfig;
  console.log(`[Wizard] Writing ansible config — proxy_enabled: ${proxyConfig?.enabled ?? false}, HTTP_PROXY: "${proxyConfig?.HTTP_PROXY || ''}"`);

  const pseudoDeployment = {
    cloudProvider: cloudProvider || 'on-premise',
    clusterConfig: clusterConfig || {},
    onPremiseConfig: onPremiseConfig || null,
    selectedComponents: selectedComponents || {},
  };

  const ansibleVarsContent = generateAnsibleVars(pseudoDeployment);
  const writtenPath = writeAnsibleVars(ansibleVarsContent);
  console.log(`[Wizard] ansible config written to: ${writtenPath}`);

  res.json({ success: true });
}));

export default router;
