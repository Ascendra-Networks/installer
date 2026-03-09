import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAnsibleOutput, calculateAnsibleProgress } from '../utils/output-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TYR_PHASE_MESSAGES = {
  'helm': 'Installing package manager...',
  'configure': 'Configuring platform services...',
  'secret': 'Setting up registry access...',
  'deploy': 'Creating network',
  'inframanager': 'Creating network',
  'kubevirt-waiting': 'Creating virtual compute',
  'network-waiting': 'Waiting for network layer...',
  'verification': 'Verifying all components...',
  'summary': 'Verifying deployment...'
};

const DASHBOARD_PHASE_MESSAGES = {
  'namespace': 'Creating monitoring namespace...',
  'secret': 'Setting up registry credentials...',
  'storage': 'Configuring storage provisioner...',
  'helm-login': 'Authenticating with container registry...',
  'influxdb': 'Creating database credentials...',
  'deploy': 'Installing Management Dashboard...',
  'verification': 'Verifying dashboard components...',
  'summary': 'Dashboard deployment complete'
};

const CLUSTER_PHASE_MESSAGES = {
  'prerequisites': 'Initializing nodes...',
  'master': 'Creating master...',
  'workers': 'Connecting workers...',
  'status': 'Verifying cluster...'
};

const TASK_MESSAGE_RULES = [
  // Prerequisites phase
  { match: /update apt/i,                     msg: 'Updating system packages...' },
  { match: /install prerequisite/i,           msg: 'Installing base packages...' },
  { match: /kernel module|modprobe/i,         msg: 'Configuring kernel modules...' },
  { match: /sysctl/i,                         msg: 'Configuring network parameters...' },
  { match: /swap/i,                           msg: 'Optimizing memory configuration...' },
  { match: /docker|containerd/i,             msg: 'Installing container runtime...' },
  { match: /kubernetes gpg|kubernetes apt|apt keyring/i, msg: 'Adding platform repository...' },
  { match: /install kubernetes tools/i,       msg: 'Installing cluster management tools...' },
  { match: /hold kubernetes/i,                msg: 'Locking platform package versions...' },
  { match: /enable kubelet/i,                 msg: 'Enabling cluster services...' },

  // Master phase
  { match: /pull.*images|config images/i,     msg: 'Downloading platform images...' },
  { match: /initialize kubernetes|kubeadm init/i, msg: 'Initializing cluster control plane...' },
  { match: /kube.*config|admin\.conf|\.kube/i, msg: 'Configuring cluster access...' },
  { match: /control plane.*ready|wait.*ready/i, msg: 'Waiting for control plane to be ready...' },
  { match: /join command|token create/i,       msg: 'Generating worker join token...' },
  { match: /cluster.info/i,                   msg: 'Retrieving cluster information...' },
  { match: /firewall|ufw/i,                   msg: 'Configuring firewall rules...' },

  // Workers / dataplane phase
  { match: /join.*cluster|kubeadm_join/i,     msg: 'Joining node to cluster...' },
  { match: /verify kubelet|kubelet.*active/i, msg: 'Verifying node health...' },
  { match: /node.*register/i,                 msg: 'Waiting for node registration...' },

  // Tyr phases
  { match: /helm.*install|install helm/i,     msg: 'Installing package manager...' },
  { match: /login.*ghcr|registry login/i,     msg: 'Authenticating with container registry...' },
  { match: /namespace/i,                      msg: 'Setting up workspace...' },
  { match: /docker.*secret|ghcr-secret/i,     msg: 'Setting up registry credentials...' },
  { match: /install tyr|helm install tyr/i,   msg: 'Deploying platform components...' },
  { match: /upgrade tyr/i,                    msg: 'Upgrading platform components...' },
  { match: /inframanager/i,                   msg: 'Applying infrastructure manager configuration...' },

  // Verification & component readiness
  { match: /wait for tyr platform|tyr.*services.*ready/i, msg: 'Waiting for platform services to be ready...' },
  { match: /verify tyr platform|tyr services health/i,    msg: 'Verifying platform services health...' },
  { match: /wait for virtual compute namespace/i,          msg: 'Waiting for virtual compute layer...' },
  { match: /wait for virtual compute component/i,          msg: 'Starting virtual compute components...' },
  { match: /verify virtual compute/i,                      msg: 'Verifying virtual compute is running...' },
  { match: /wait for network layer/i,                      msg: 'Waiting for network layer to be ready...' },
  { match: /verify network layer/i,                        msg: 'Verifying network layer is running...' },
  { match: /verify all components.*final/i,                msg: 'Running final health check...' },
  { match: /deployment summary/i,                          msg: 'All components are up and running' },

  { match: /kubevirt/i,                       msg: 'Creating virtual compute...' },
  { match: /kube.ovn|kube-ovn/i,             msg: 'Creating network...' },

  // Dashboard phases
  { match: /monitoring namespace/i,           msg: 'Setting up monitoring namespace...' },
  { match: /local.path.provisioner/i,         msg: 'Installing storage provisioner...' },
  { match: /storageclass.*default/i,          msg: 'Configuring default storage class...' },
  { match: /influxdb.credentials/i,           msg: 'Creating database credentials...' },
  { match: /install management.dashboard/i,   msg: 'Installing Management Dashboard...' },
  { match: /upgrade management.dashboard/i,   msg: 'Upgrading Management Dashboard...' },
  { match: /dashboard.*pods.*ready/i,         msg: 'Waiting for dashboard to be ready...' },
  { match: /dashboard.*health/i,              msg: 'Verifying dashboard health...' },
  { match: /dashboard.*deployment.*summary/i, msg: 'Dashboard deployment complete' },
];

function getTaskFriendlyMessage(taskName) {
  if (!taskName) return null;
  for (const rule of TASK_MESSAGE_RULES) {
    if (rule.match.test(taskName)) {
      return rule.msg;
    }
  }
  return null;
}

class AnsibleService {
  constructor(deployment, progressCallback) {
    this.deployment = deployment;
    this.progressCallback = progressCallback;
    this.events = [];
    this.process = null;
    this.currentPhase = null;
    this.currentPlaybook = null;
    this.taskCount = 0;
    this.lastTaskMessage = '';

    this.projectRoot = path.resolve(__dirname, process.env.PROJECT_ROOT || '../../../');
    this.ansiblePlaybooksDir = path.join(
      this.projectRoot,
      process.env.ANSIBLE_PLAYBOOKS_DIR || 'ansible/playbooks'
    );
    this.ansibleInventoryDir = path.join(
      this.projectRoot,
      process.env.ANSIBLE_INVENTORY_DIR || 'ansible/inventory'
    );
    const clusterName = deployment.clusterConfig?.name || deployment.onPremiseConfig?.clusterName;
    this.inventoryFile = `${clusterName}.ini`;
  }

  executePlaybook(playbookName, extraVars = {}) {
    const playbookPath = path.join(this.ansiblePlaybooksDir, playbookName);
    const inventoryPath = path.join(this.ansibleInventoryDir, this.inventoryFile);

    const args = ['-i', inventoryPath, playbookPath];

    for (const [key, value] of Object.entries(extraVars)) {
      args.push('-e', `${key}=${value}`);
    }

    const ansibleDir = path.join(this.projectRoot, 'ansible');

    return new Promise((resolve, reject) => {
      const ansible = spawn('ansible-playbook', args, {
        cwd: ansibleDir,
        shell: true,
        env: {
          ...process.env,
          ANSIBLE_CONFIG: path.join(ansibleDir, 'ansible.cfg'),
          ANSIBLE_FORCE_COLOR: 'true',
          ANSIBLE_HOST_KEY_CHECKING: 'False'
        }
      });

      let output = '';
      let errorOutput = '';

      ansible.stdout.on('data', (data) => {
        const line = data.toString();
        output += line;
        const lines = line.split('\n');

        lines.forEach(l => {
          if (l.trim()) {
            console.log(`[Ansible:${this.currentPlaybook}] ${l.trim()}`);
            const parsed = parseAnsibleOutput(l, this.currentPlaybook);

            if (parsed.event) {
              this.events.push(parsed);

              if (parsed.phase) {
                this.currentPhase = parsed.phase;
                this.taskCount = 0;
                this.lastTaskMessage = '';
              }

              if (parsed.event === 'task') {
                this.taskCount++;
                const taskMsg = getTaskFriendlyMessage(parsed.task);
                if (taskMsg) {
                  this.lastTaskMessage = taskMsg;
                }
              }

              const progress = calculateAnsibleProgress(this.currentPhase, this.currentPlaybook);
              const phaseMessages = this.currentPlaybook === 'tyr-deploy'
                ? TYR_PHASE_MESSAGES
                : this.currentPlaybook === 'dashboard-deploy'
                  ? DASHBOARD_PHASE_MESSAGES
                  : CLUSTER_PHASE_MESSAGES;
              const message = this.lastTaskMessage
                || phaseMessages[this.currentPhase]
                || parsed.message || l.trim();

              this.progressCallback({
                phase: 'ansible',
                step: this.currentPhase || 'running',
                progress,
                message,
                playbook: this.currentPlaybook,
                output: l.trim()
              });
            }

            if (parsed.isError) {
              console.error(`[Ansible:${this.currentPlaybook} Error] ${parsed.message}`);
            }
          }
        });
      });

      ansible.stderr.on('data', (data) => {
        const line = data.toString();
        errorOutput += line;
        console.log(`[Ansible:${this.currentPlaybook} Stderr] ${line.trim()}`);
      });

      ansible.on('close', (code) => {
        if (code === 0) {
          console.log(`[Ansible] Playbook ${playbookName} completed successfully`);
          resolve(output);
        } else {
          console.error(`[Ansible] Playbook ${playbookName} failed with code ${code}`);
          reject(new Error(`Ansible playbook ${playbookName} failed with code ${code}: ${errorOutput}`));
        }
      });

      this.process = ansible;
    });
  }

  async deployCluster() {
    console.log('[Ansible] Deploying Kubernetes cluster...');
    this.currentPlaybook = 'k8s-cluster-deploy';
    this.currentPhase = null;
    this.events = [];
    this.taskCount = 0;
    this.lastTaskMessage = '';

    this.progressCallback({
      phase: 'ansible',
      step: 'starting',
      progress: 0,
      message: 'Starting cluster deployment...',
      playbook: 'k8s-cluster-deploy'
    });

    try {
      await this.executePlaybook('ascendra-environment/k8s-cluster-deploy.yml');

      this.progressCallback({
        phase: 'ansible',
        step: 'cluster_complete',
        progress: 100,
        message: 'Cluster deployment completed',
        playbook: 'k8s-cluster-deploy'
      });
    } catch (error) {
      throw new Error(`Cluster deployment failed: ${error.message}`);
    }
  }

  async deployTyr() {
    console.log('[Ansible] Deploying Tyr...');
    this.currentPlaybook = 'tyr-deploy';
    this.currentPhase = null;
    this.events = [];
    this.taskCount = 0;
    this.lastTaskMessage = '';

    this.progressCallback({
      phase: 'ansible',
      step: 'tyr_starting',
      progress: 0,
      message: 'Creating network',
      playbook: 'tyr-deploy'
    });

    try {
      const extraVars = {
        ghcr_username: process.env.GHCR_USERNAME || '',
        ghcr_password: process.env.GHCR_PASSWORD || '',
        tyr_version: process.env.TYR_VERSION || '1.0.7'
      };

      await this.executePlaybook('ascendra-environment/tyr-deploy.yml', extraVars);

      this.progressCallback({
        phase: 'ansible',
        step: 'tyr_complete',
        progress: 100,
        message: 'Infrastructure configuration completed',
        playbook: 'tyr-deploy'
      });
    } catch (error) {
      throw new Error(`Tyr deployment failed: ${error.message}`);
    }
  }

  async deployDashboard() {
    console.log('[Ansible] Deploying Management Dashboard...');
    this.currentPlaybook = 'dashboard-deploy';
    this.currentPhase = null;
    this.events = [];
    this.taskCount = 0;
    this.lastTaskMessage = '';

    this.progressCallback({
      phase: 'ansible',
      step: 'dashboard_starting',
      progress: 0,
      message: 'Setting up monitoring namespace...',
      playbook: 'dashboard-deploy'
    });

    try {
      const extraVars = {
        ghcr_username: process.env.GHCR_USERNAME || '',
        ghcr_password: process.env.GHCR_PASSWORD || ''
      };
      const output = await this.executePlaybook('ascendra-environment/dashboard-deploy.yml', extraVars);

      let dashboardUrl = null;
      // Strip ANSI escape codes before parsing
      const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      const urlMatch = cleanOutput.match(/DASHBOARD_ACCESS_URL=(https?:\/\/[^\s"'\]]+)/);
      if (urlMatch) {
        dashboardUrl = urlMatch[1];
        console.log(`[Ansible] Dashboard URL detected: ${dashboardUrl}`);
      } else {
        console.warn('[Ansible] Could not detect dashboard URL from playbook output');
      }

      this.progressCallback({
        phase: 'ansible',
        step: 'dashboard_complete',
        progress: 100,
        message: 'Management Dashboard deployed successfully',
        playbook: 'dashboard-deploy'
      });

      return { dashboardUrl };
    } catch (error) {
      throw new Error(`Dashboard deployment failed: ${error.message}`);
    }
  }

  async execute() {
    try {
      await this.deployCluster();

      const { selectedComponents } = this.deployment;
      if (selectedComponents && selectedComponents['backend-api']) {
        await this.deployTyr();
      }

      this.progressCallback({
        phase: 'ansible',
        step: 'complete',
        progress: 100,
        message: 'All deployments completed successfully',
        playbook: 'all'
      });

      return { success: true };
    } catch (error) {
      this.progressCallback({
        phase: 'ansible',
        step: 'error',
        progress: 0,
        message: error.message,
        error: true,
        playbook: this.currentPlaybook
      });
      throw error;
    }
  }

  cancel() {
    if (this.process) {
      console.log('[Ansible] Cancelling process...');
      this.process.kill('SIGTERM');
    }
  }
}

export default AnsibleService;
