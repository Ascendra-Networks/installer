import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'deployments.json');
const WIZARD_STATE_FILE = path.join(__dirname, 'wizard-state.json');

/**
 * Initialize state file if it doesn't exist
 */
function initializeState() {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2));
    console.log('Initialized deployments state file');
  }
}

/**
 * Read all deployments from state
 */
function readState() {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading state:', error);
    return {};
  }
}

/**
 * Write state to file
 */
function writeState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error writing state:', error);
    throw error;
  }
}

/**
 * Get a specific deployment
 */
function getDeployment(id) {
  const state = readState();
  return state[id] || null;
}

/**
 * Save or update a deployment
 */
function saveDeployment(id, deployment) {
  const state = readState();
  state[id] = {
    ...state[id],
    ...deployment,
    updatedAt: new Date().toISOString()
  };
  writeState(state);
  return state[id];
}

/**
 * Update deployment status
 */
function updateDeploymentStatus(id, status, additionalData = {}) {
  const deployment = getDeployment(id);
  if (!deployment) {
    throw new Error(`Deployment ${id} not found`);
  }

  return saveDeployment(id, {
    ...deployment,
    status,
    ...additionalData
  });
}

/**
 * Update deployment phase
 */
function updateDeploymentPhase(id, phase, phaseData) {
  const deployment = getDeployment(id);
  if (!deployment) {
    throw new Error(`Deployment ${id} not found`);
  }

  const phases = deployment.phases || {};
  phases[phase] = {
    ...phases[phase],
    ...phaseData
  };

  return saveDeployment(id, {
    ...deployment,
    phases
  });
}

/**
 * Get all deployments
 */
function getAllDeployments() {
  return readState();
}

/**
 * Delete a deployment
 */
function deleteDeployment(id) {
  const state = readState();
  delete state[id];
  writeState(state);
}

/**
 * Load persisted wizard session state
 */
function getWizardState() {
  try {
    if (!fs.existsSync(WIZARD_STATE_FILE)) return null;
    const data = fs.readFileSync(WIZARD_STATE_FILE, 'utf8');
    const state = JSON.parse(data);
    if (!state || !state.savedAt) return null;
    return state;
  } catch (error) {
    console.error('Error reading wizard state:', error);
    return null;
  }
}

/**
 * Persist wizard session state to disk
 */
function saveWizardState(wizardState) {
  try {
    const payload = {
      ...wizardState,
      savedAt: new Date().toISOString()
    };
    fs.writeFileSync(WIZARD_STATE_FILE, JSON.stringify(payload, null, 2));
    return payload;
  } catch (error) {
    console.error('Error saving wizard state:', error);
    throw error;
  }
}

/**
 * Clear wizard session state (e.g. after reset)
 */
function clearWizardState() {
  try {
    if (fs.existsSync(WIZARD_STATE_FILE)) {
      fs.unlinkSync(WIZARD_STATE_FILE);
    }
  } catch (error) {
    console.error('Error clearing wizard state:', error);
  }
}

export {
  initializeState,
  readState,
  writeState,
  getDeployment,
  saveDeployment,
  updateDeploymentStatus,
  updateDeploymentPhase,
  getAllDeployments,
  deleteDeployment,
  getWizardState,
  saveWizardState,
  clearWizardState
};


