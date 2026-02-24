import { getDeployment, updateDeploymentStatus, updateDeploymentPhase } from '../state/manager.js';
import { generateConfigurations } from './config-generator.service.js';
import TerraformService from './terraform.service.js';
import AnsibleService from './ansible.service.js';
import { waitForSSHReady } from '../utils/ssh-checker.js';
import onPremiseService from './onpremise.service.js';
import inventoryGenerator from './inventory-generator.service.js';

const activeDeployments = new Map();
const pendingRetries = new Map();
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isDeploymentRunning(deploymentId) {
  return activeDeployments.has(deploymentId);
}

function emitSubStepUpdate(io, deploymentId, subStepId, data) {
  io.to(`deployment:${deploymentId}`).emit('deployment:substep', {
    deploymentId,
    subStepId,
    ...data
  });
}

function waitForManualRetry(deploymentId, subStepId) {
  return new Promise((resolve, reject) => {
    pendingRetries.set(`${deploymentId}:${subStepId}`, { resolve, reject });
  });
}

/**
 * Trigger manual retry for a specific sub-step (called from WebSocket handler)
 */
function triggerManualRetry(deploymentId, subStepId) {
  const key = `${deploymentId}:${subStepId}`;
  const pending = pendingRetries.get(key);
  if (pending) {
    pendingRetries.delete(key);
    pending.resolve();
    return true;
  }
  return false;
}

async function runSubStepWithRetry(subStepId, subStepFn, deploymentId, io, progressCallback, context) {
  const run = async (attemptNum) => {
    emitSubStepUpdate(io, deploymentId, subStepId, {
      status: attemptNum > 1 ? 'retrying' : 'running',
      attempt: attemptNum,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      message: attemptNum > 1 ? `Retry attempt ${attemptNum}/${MAX_RETRY_ATTEMPTS}...` : ''
    });

    try {
      const result = await subStepFn(progressCallback, context);

      emitSubStepUpdate(io, deploymentId, subStepId, {
        status: 'completed',
        attempt: attemptNum,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        message: ''
      });

      return result;
    } catch (error) {
      console.error(`[Deployment] Sub-step ${subStepId} failed (attempt ${attemptNum}/${MAX_RETRY_ATTEMPTS}):`, error.message);

      if (attemptNum < MAX_RETRY_ATTEMPTS) {
        emitSubStepUpdate(io, deploymentId, subStepId, {
          status: 'retrying',
          attempt: attemptNum,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          error: error.message,
          message: `Attempt ${attemptNum} failed. Retrying automatically...`
        });
        await sleep(RETRY_DELAY_MS);
        return run(attemptNum + 1);
      }

      emitSubStepUpdate(io, deploymentId, subStepId, {
        status: 'failed',
        attempt: attemptNum,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        error: error.message,
        message: `Failed after ${MAX_RETRY_ATTEMPTS} attempts`
      });

      console.log(`[Deployment] Waiting for manual retry of sub-step ${subStepId}...`);
      await waitForManualRetry(deploymentId, subStepId);
      console.log(`[Deployment] Manual retry triggered for sub-step ${subStepId}`);

      return run(1);
    }
  };

  return run(1);
}

async function executeDeployment(deploymentId, io) {
  const deployment = getDeployment(deploymentId);

  if (!deployment) throw new Error(`Deployment ${deploymentId} not found`);
  if (isDeploymentRunning(deploymentId)) throw new Error(`Deployment ${deploymentId} is already running`);

  if (activeDeployments.size > 0) {
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_DEPLOYMENTS || '1');
    if (activeDeployments.size >= maxConcurrent) {
      throw new Error('Maximum concurrent deployments reached. Please wait for existing deployments to complete.');
    }
  }

  console.log(`[Deployment] Starting deployment: ${deploymentId}`);
  updateDeploymentStatus(deploymentId, 'running', { startedAt: new Date().toISOString() });

  const isOnPremise = deployment.cloudProvider === 'on-premise' || deployment.cloudProvider === 'onpremise';

  const activeDeployment = {
    terraformService: null,
    ansibleService: null,
    startedAt: new Date()
  };
  activeDeployments.set(deploymentId, activeDeployment);

  const context = {
    sshKeyPath: null,
    sshPassword: null,
    allHosts: [],
    sshUser: isOnPremise ? (deployment.onPremiseConfig?.controlPlane?.sshConfig?.user || 'root') : 'ubuntu',
    terraformOutputs: null,
    configs: null
  };

  const progressCallback = (progressData) => {
    updateDeploymentPhase(deploymentId, progressData.phase, {
      status: progressData.error ? 'failed' : 'running',
      progress: progressData.progress,
      currentStep: progressData.step,
      message: progressData.message
    });

    io.to(`deployment:${deploymentId}`).emit('deployment:progress', {
      deploymentId,
      ...progressData
    });

    if (progressData.output) {
      io.to(`deployment:${deploymentId}`).emit(`deployment:${progressData.phase}:output`, {
        deploymentId,
        output: progressData.output
      });
    }
  };

  try {
    // === INITIALIZATION ===
    progressCallback({
      phase: 'config',
      subStep: isOnPremise ? 'cluster' : 'infrastructure',
      step: 'generating',
      progress: 0,
      message: isOnPremise
        ? 'Generating Ansible configurations...'
        : 'Generating Terraform and Ansible configurations...'
    });

    context.configs = generateConfigurations(deployment);

    progressCallback({
      phase: 'config',
      subStep: isOnPremise ? 'cluster' : 'infrastructure',
      step: 'complete',
      progress: 2,
      message: 'Configurations generated successfully'
    });

    if (isOnPremise) {
      const onPremConfig = deployment.onPremiseConfig;
      if (!onPremConfig) throw new Error('On-premise configuration not found');

      const validation = onPremiseService.validateConfig(onPremConfig);
      if (!validation.valid) throw new Error(`Configuration validation failed: ${validation.error}`);

      context.sshPassword = onPremConfig.controlPlane?.sshConfig?.password;
      context.sshUser = onPremConfig.controlPlane?.sshConfig?.user || 'root';

      const inventoryPath = inventoryGenerator.createFromOnPremise(onPremConfig);
      console.log(`[Deployment] Generated inventory: ${inventoryPath}`);

      context.allHosts = [
        ...onPremConfig.controlPlane.nodes.map(n => n.ip),
        ...onPremConfig.workerNodes.flatMap(g => g.nodes.map(n => n.ip))
      ];

      progressCallback({
        phase: 'waiting',
        subStep: 'cluster',
        step: 'checking-ssh',
        progress: 3,
        message: 'Checking SSH connectivity to all nodes...'
      });

      const sshReady = await waitForSSHReady(context.allHosts, null, context.sshUser, 5, context.sshPassword);
      if (!sshReady) throw new Error('Timeout waiting for SSH. Please check connectivity.');

      progressCallback({
        phase: 'waiting',
        subStep: 'cluster',
        step: 'ssh-ready',
        progress: 5,
        message: 'All nodes are ready'
      });
    }

    // === SUB-STEP 1: CREATE INFRASTRUCTURE (cloud only) ===
    if (!isOnPremise) {
      await runSubStepWithRetry('infrastructure', async (cb, ctx) => {
        console.log(`[Deployment] Starting infrastructure sub-step`);

        cb({
          phase: 'terraform',
          subStep: 'infrastructure',
          step: 'starting',
          progress: 5,
          message: 'Starting infrastructure provisioning...'
        });

        const terraformService = new TerraformService(deployment, (data) => {
          cb({ ...data, subStep: 'infrastructure' });
        });
        activeDeployment.terraformService = terraformService;

        ctx.terraformOutputs = await terraformService.execute();

        updateDeploymentPhase(deploymentId, 'terraform', {
          status: 'completed',
          progress: 100,
          outputs: ctx.terraformOutputs
        });

        ctx.sshKeyPath = ctx.terraformOutputs.ssh_private_key_path?.value;
        const masterIps = ctx.terraformOutputs.master_ips?.value
          || ctx.terraformOutputs.master_public_ips?.value || [];
        const workerIps = ctx.terraformOutputs.worker_ips?.value
          || ctx.terraformOutputs.worker_public_ips?.value || [];
        ctx.allHosts = [...masterIps, ...workerIps];

        if (!ctx.sshKeyPath) throw new Error('SSH private key path not found in Terraform outputs');
        if (ctx.allHosts.length === 0) throw new Error('No instance IPs found in Terraform outputs');

        cb({
          phase: 'terraform',
          subStep: 'infrastructure',
          step: 'generating-inventory',
          progress: 75,
          message: 'Generating Ansible inventory from Terraform outputs...'
        });

        inventoryGenerator.createFromTerraform(deployment.clusterConfig.name, ctx.terraformOutputs);

        cb({
          phase: 'waiting',
          subStep: 'infrastructure',
          step: 'checking-ssh',
          progress: 80,
          message: 'Checking SSH connectivity to all nodes...'
        });

        const sshReady = await waitForSSHReady(ctx.allHosts, ctx.sshKeyPath, ctx.sshUser, 5);
        if (!sshReady) throw new Error('Timeout waiting for SSH.');

        cb({
          phase: 'waiting',
          subStep: 'infrastructure',
          step: 'ssh-ready',
          progress: 90,
          message: 'All nodes are ready and SSH is available'
        });
      }, deploymentId, io, progressCallback, context);
    }

    // === SUB-STEP 2: CREATE CLUSTER ===
    await runSubStepWithRetry('cluster', async (cb, ctx) => {
      console.log(`[Deployment] Starting cluster sub-step`);

      const ansibleService = new AnsibleService(deployment, (data) => {
        cb({ ...data, subStep: 'cluster', playbook: 'k8s-cluster-deploy' });
      });
      activeDeployment.ansibleService = ansibleService;

      await ansibleService.deployCluster();

      updateDeploymentPhase(deploymentId, 'ansible-cluster', {
        status: 'completed',
        progress: 100
      });

      console.log(`[Deployment] Cluster sub-step completed`);
    }, deploymentId, io, progressCallback, context);

    // === SUB-STEP 3: INFRASTRUCTURE CONFIGURATION (tyr-deploy) ===
    const { selectedComponents } = deployment;
    if (!selectedComponents || selectedComponents['backend-api'] !== false) {
      await runSubStepWithRetry('configuration', async (cb, ctx) => {
        console.log(`[Deployment] Starting configuration sub-step`);

        const ansibleService = new AnsibleService(deployment, (data) => {
          cb({ ...data, subStep: 'configuration', playbook: 'tyr-deploy' });
        });
        activeDeployment.ansibleService = ansibleService;

        await ansibleService.deployTyr();

        updateDeploymentPhase(deploymentId, 'ansible-tyr', {
          status: 'completed',
          progress: 100
        });

        console.log(`[Deployment] Configuration sub-step completed`);
      }, deploymentId, io, progressCallback, context);
    } else {
      emitSubStepUpdate(io, deploymentId, 'configuration', {
        status: 'completed',
        attempt: 0,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        message: 'Skipped (no components selected)'
      });
    }

    // === COMPLETION ===
    updateDeploymentStatus(deploymentId, 'completed', { completedAt: new Date().toISOString() });

    io.to(`deployment:${deploymentId}`).emit('deployment:completed', {
      deploymentId,
      message: 'Deployment completed successfully',
      terraformOutputs: isOnPremise ? null : context.terraformOutputs,
      deploymentType: isOnPremise ? 'on-premise' : 'cloud'
    });

    console.log(`[Deployment] Deployment ${deploymentId} completed successfully`);

  } catch (error) {
    console.error(`[Deployment] Deployment ${deploymentId} failed:`, error);

    updateDeploymentStatus(deploymentId, 'failed', {
      failedAt: new Date().toISOString(),
      error: error.message
    });

    io.to(`deployment:${deploymentId}`).emit('deployment:failed', {
      deploymentId,
      error: error.message || 'Deployment failed'
    });

    throw error;

  } finally {
    activeDeployments.delete(deploymentId);
    for (const key of pendingRetries.keys()) {
      if (key.startsWith(`${deploymentId}:`)) {
        pendingRetries.delete(key);
      }
    }
  }
}

async function installComponents(deploymentId, selectedComponents, io) {
  const deployment = getDeployment(deploymentId);
  if (!deployment) throw new Error(`Deployment ${deploymentId} not found`);

  console.log(`[Deployment] Installing components for deployment: ${deploymentId}`, selectedComponents);

  const componentIds = Object.keys(selectedComponents).filter(id => selectedComponents[id]);
  if (componentIds.length === 0) {
    io.to(`deployment:${deploymentId}`).emit('installation:completed', {
      deploymentId,
      message: 'No components selected for installation'
    });
    return;
  }

  // Emit initial progress for each component
  for (const componentId of componentIds) {
    io.to(`deployment:${deploymentId}`).emit('installation:progress', {
      deploymentId,
      componentId,
      status: 'pending',
      progress: 0,
      message: 'Waiting to start...'
    });
  }

  let dashboardUrl = null;

  try {
    // Deploy Dashboard if selected
    if (selectedComponents['dashboard']) {
      io.to(`deployment:${deploymentId}`).emit('installation:progress', {
        deploymentId,
        componentId: 'dashboard',
        status: 'installing',
        progress: 5,
        message: 'Starting dashboard deployment...'
      });

      const ansibleService = new AnsibleService(deployment, (data) => {
        const progress = Math.min(95, Math.max(5, data.progress || 0));
        io.to(`deployment:${deploymentId}`).emit('installation:progress', {
          deploymentId,
          componentId: 'dashboard',
          status: 'installing',
          progress,
          message: data.message || 'Deploying...'
        });
      });

      const result = await ansibleService.deployDashboard();
      dashboardUrl = result?.dashboardUrl || null;

      io.to(`deployment:${deploymentId}`).emit('installation:progress', {
        deploymentId,
        componentId: 'dashboard',
        status: 'completed',
        progress: 100,
        message: 'Management Dashboard deployed successfully',
        dashboardUrl
      });
    }

    io.to(`deployment:${deploymentId}`).emit('installation:completed', {
      deploymentId,
      message: 'All components installed successfully',
      dashboardUrl
    });

    console.log(`[Deployment] Component installation completed for: ${deploymentId}`);
  } catch (error) {
    console.error(`[Deployment] Component installation failed for ${deploymentId}:`, error);

    for (const componentId of componentIds) {
      io.to(`deployment:${deploymentId}`).emit('installation:progress', {
        deploymentId,
        componentId,
        status: 'failed',
        progress: 0,
        message: error.message || 'Installation failed'
      });
    }

    io.to(`deployment:${deploymentId}`).emit('installation:failed', {
      deploymentId,
      error: error.message || 'Component installation failed'
    });
  }
}

async function cancelDeployment(deploymentId) {
  const activeDeployment = activeDeployments.get(deploymentId);

  if (!activeDeployment) {
    throw new Error(`No active deployment found for ${deploymentId}`);
  }

  console.log(`[Deployment] Cancelling deployment: ${deploymentId}`);

  if (activeDeployment.terraformService) {
    activeDeployment.terraformService.cancel();
  }

  if (activeDeployment.ansibleService) {
    activeDeployment.ansibleService.cancel();
  }

  // Reject any pending manual retries
  for (const [key, { reject }] of pendingRetries.entries()) {
    if (key.startsWith(`${deploymentId}:`)) {
      reject(new Error('Deployment cancelled'));
      pendingRetries.delete(key);
    }
  }

  updateDeploymentStatus(deploymentId, 'cancelled', { cancelledAt: new Date().toISOString() });
  activeDeployments.delete(deploymentId);

  console.log(`[Deployment] Deployment ${deploymentId} cancelled`);
}

function getActiveDeployments() {
  return Array.from(activeDeployments.keys());
}

export {
  executeDeployment,
  installComponents,
  cancelDeployment,
  triggerManualRetry,
  isDeploymentRunning,
  getActiveDeployments
};
