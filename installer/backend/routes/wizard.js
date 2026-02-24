import express from 'express';
import { getWizardState, saveWizardState, clearWizardState, getDeployment } from '../state/manager.js';
import { asyncErrorHandler } from '../utils/error-handler.js';

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

export default router;
