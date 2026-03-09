import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseTerraformOutput, calculateTerraformProgress } from '../utils/output-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TerraformService {
  constructor(deployment, progressCallback) {
    this.deployment = deployment;
    this.progressCallback = progressCallback;
    this.events = [];
    this.process = null;
    this.lastMessageTime = Date.now();

    this.projectRoot = path.resolve(__dirname, process.env.PROJECT_ROOT || '../../../');
    this.terraformEnvDir = path.join(
      this.projectRoot,
      process.env.TERRAFORM_ENV_DIR || 'terraform/environments/aws'
    );
    this.tfvarsFile = `${deployment.clusterConfig.name}.tfvars`;
  }

  /**
   * Start a heartbeat that sends a message if no progress has been emitted recently.
   * Returns a cleanup function.
   */
  _startHeartbeat(step, getProgress, idleMessages) {
    let msgIndex = 0;
    const interval = setInterval(() => {
      const silentMs = Date.now() - this.lastMessageTime;
      if (silentMs > 4000) {
        const msg = idleMessages[msgIndex % idleMessages.length];
        msgIndex++;
        this.progressCallback({
          phase: 'terraform',
          step,
          progress: getProgress(),
          message: msg
        });
        this.lastMessageTime = Date.now();
      }
    }, 3000);
    return () => clearInterval(interval);
  }

  _sendProgress(data) {
    this.lastMessageTime = Date.now();
    this.progressCallback(data);
  }

  async selectWorkspace() {
    const workspaceName = this.deployment.clusterConfig.name;
    console.log(`[Terraform] Managing workspace: ${workspaceName}`);

    return new Promise((resolve, reject) => {
      const createWs = spawn('terraform', ['workspace', 'new', workspaceName], {
        cwd: this.terraformEnvDir,
        shell: true
      });

      let output = '';
      createWs.stdout.on('data', (data) => output += data.toString());
      createWs.stderr.on('data', (data) => output += data.toString());

      createWs.on('close', (code) => {
        if (code === 0) {
          console.log(`[Terraform] Created and selected workspace: ${workspaceName}`);
          resolve();
        } else {
          console.log(`[Terraform] Workspace exists, selecting: ${workspaceName}`);

          const selectWs = spawn('terraform', ['workspace', 'select', workspaceName], {
            cwd: this.terraformEnvDir,
            shell: true
          });

          selectWs.on('close', (selectCode) => {
            if (selectCode === 0) {
              console.log(`[Terraform] Selected workspace: ${workspaceName}`);
              resolve();
            } else {
              reject(new Error(`Failed to select workspace ${workspaceName}`));
            }
          });
        }
      });
    });
  }

  async init() {
    console.log(`[Terraform] Initializing in ${this.terraformEnvDir}`);

    // Remove stale .terraform directory so init always starts clean.
    const dotTerraformDir = path.join(this.terraformEnvDir, '.terraform');
    if (fs.existsSync(dotTerraformDir)) {
      fs.rmSync(dotTerraformDir, { recursive: true, force: true });
      console.log('[Terraform] Removed stale .terraform directory');
    }

    this._sendProgress({
      phase: 'terraform',
      step: 'init',
      progress: 2,
      message: 'Connecting to cloud provider...'
    });

    let initProgress = 2;

    const stopHeartbeat = this._startHeartbeat('init', () => initProgress, [
      'Loading infrastructure modules...',
      'Validating provider configuration...',
      'Checking plugin compatibility...',
      'Preparing workspace...',
    ]);

    return new Promise((resolve, reject) => {
      // `-force-copy` auto-migrates state without prompting, works cross-platform.
      const terraform = spawn('terraform', ['init', '-force-copy'], {
        cwd: this.terraformEnvDir,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      const handleLine = (l) => {
        if (!l.trim()) return;
        console.log(`[Terraform Init] ${l.trim()}`);
        const parsed = parseTerraformOutput(l);

        if (parsed.event && parsed.event.startsWith('init_')) {
          initProgress = Math.min(initProgress + 2, 12);
          this._sendProgress({
            phase: 'terraform',
            step: 'init',
            progress: initProgress,
            message: parsed.message
          });
        }
      };

      terraform.stdout.on('data', (data) => {
        const line = data.toString();
        output += line;
        line.split('\n').forEach(handleLine);
      });

      terraform.stderr.on('data', (data) => {
        const line = data.toString();
        errorOutput += line;
        line.split('\n').forEach(handleLine);
      });

      terraform.on('close', async (code) => {
        stopHeartbeat();
        if (code === 0) {
          console.log('[Terraform] Init completed successfully');
          this._sendProgress({
            phase: 'terraform',
            step: 'init',
            progress: 14,
            message: 'Initialization complete'
          });
          try {
            this._sendProgress({
              phase: 'terraform',
              step: 'init',
              progress: 15,
              message: 'Selecting deployment workspace...'
            });
            await this.selectWorkspace();
            this._sendProgress({
              phase: 'terraform',
              step: 'init',
              progress: 16,
              message: 'Workspace ready'
            });
            resolve(output);
          } catch (err) {
            reject(err);
          }
        } else {
          console.error('[Terraform] Init failed');
          reject(new Error(`Terraform init failed with code ${code}: ${errorOutput}`));
        }
      });

      this.process = terraform;
    });
  }

  async plan() {
    console.log(`[Terraform] Planning with tfvars: ${this.tfvarsFile}`);

    this._sendProgress({
      phase: 'terraform',
      step: 'plan',
      progress: 16,
      message: 'Analyzing current infrastructure...'
    });

    let planProgress = 16;

    const stopHeartbeat = this._startHeartbeat('plan', () => planProgress, [
      'Reading resource states...',
      'Comparing desired vs actual state...',
      'Evaluating configuration changes...',
      'Computing resource dependencies...',
      'Building execution graph...',
    ]);

    return new Promise((resolve, reject) => {
      const terraform = spawn('terraform', [
        'plan',
        `-var-file=${this.tfvarsFile}`,
        '-out=tfplan',
        '-input=false'
      ], {
        cwd: this.terraformEnvDir,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      const handleLine = (l) => {
        if (!l.trim()) return;
        console.log(`[Terraform Plan] ${l.trim()}`);
        const parsed = parseTerraformOutput(l);

        if (parsed.event) {
          this.events.push(parsed);
          planProgress = Math.min(planProgress + 1, 20);
          this._sendProgress({
            phase: 'terraform',
            step: 'plan',
            progress: planProgress,
            message: parsed.message || 'Planning infrastructure...'
          });
        }
      };

      terraform.stdout.on('data', (data) => {
        const line = data.toString();
        output += line;
        line.split('\n').forEach(handleLine);
      });

      terraform.stderr.on('data', (data) => {
        const line = data.toString();
        errorOutput += line;
        line.split('\n').forEach(handleLine);
      });

      terraform.on('close', (code) => {
        stopHeartbeat();
        if (code === 0) {
          console.log('[Terraform] Plan completed successfully');
          this._sendProgress({
            phase: 'terraform',
            step: 'plan',
            progress: 20,
            message: 'Plan complete — applying changes...'
          });
          resolve(output);
        } else {
          console.error('[Terraform] Plan failed');
          reject(new Error(`Terraform plan failed with code ${code}: ${errorOutput}`));
        }
      });

      this.process = terraform;
    });
  }

  async apply() {
    console.log(`[Terraform] Applying configuration...`);

    this._sendProgress({
      phase: 'terraform',
      step: 'apply',
      progress: 20,
      message: 'Starting resource creation...'
    });

    const baseProgress = 20;

    const stopHeartbeat = this._startHeartbeat('apply', () => {
      const rp = calculateTerraformProgress(this.events);
      return baseProgress + Math.floor(rp * 0.45);
    }, [
      'Provisioning cloud resources...',
      'Waiting for resource creation...',
      'Configuring network infrastructure...',
      'Setting up compute instances...',
    ]);

    return new Promise((resolve, reject) => {
      const terraform = spawn('terraform', [
        'apply',
        '-auto-approve',
        '-input=false',
        `-var-file=${this.tfvarsFile}`
      ], {
        cwd: this.terraformEnvDir,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, TF_IN_AUTOMATION: '1' }
      });

      let output = '';
      let errorOutput = '';

      const handleLine = (l) => {
        if (!l.trim()) return;
        console.log(`[Terraform Apply] ${l.trim()}`);
        const parsed = parseTerraformOutput(l);

        if (parsed.event) {
          this.events.push(parsed);

          const resourceProgress = calculateTerraformProgress(this.events);
          const progress = baseProgress + Math.floor(resourceProgress * 0.45);

          this._sendProgress({
            phase: 'terraform',
            step: 'apply',
            progress: Math.min(progress, 65),
            message: parsed.message || 'Creating resources...',
            output: l.trim()
          });
        }

        if (parsed.isError) {
          console.error(`[Terraform Apply Error] ${parsed.message}`);
        }
      };

      terraform.stdout.on('data', (data) => {
        const line = data.toString();
        output += line;
        line.split('\n').forEach(handleLine);
      });

      terraform.stderr.on('data', (data) => {
        const line = data.toString();
        errorOutput += line;
        line.split('\n').forEach(handleLine);
      });

      terraform.on('close', (code) => {
        stopHeartbeat();
        if (code === 0) {
          console.log('[Terraform] Apply completed successfully');
          resolve(output);
        } else {
          console.error('[Terraform] Apply failed');
          reject(new Error(`Terraform apply failed with code ${code}: ${errorOutput}`));
        }
      });

      this.process = terraform;
    });
  }

  async getOutputs() {
    console.log('[Terraform] Retrieving outputs...');

    return new Promise((resolve, reject) => {
      const terraform = spawn('terraform', ['output', '-json'], {
        cwd: this.terraformEnvDir,
        shell: true
      });

      let output = '';
      let errorOutput = '';

      terraform.stdout.on('data', (data) => {
        output += data.toString();
      });

      terraform.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      terraform.on('close', (code) => {
        if (code === 0) {
          try {
            const outputs = JSON.parse(output);
            console.log('[Terraform] Outputs retrieved successfully');
            resolve(outputs);
          } catch (error) {
            reject(new Error(`Failed to parse Terraform outputs: ${error.message}`));
          }
        } else {
          reject(new Error(`Failed to get Terraform outputs: ${errorOutput}`));
        }
      });

      this.process = terraform;
    });
  }

  async execute() {
    try {
      await this.init();
      await this.plan();
      await this.apply();

      this._sendProgress({
        phase: 'terraform',
        step: 'outputs',
        progress: 68,
        message: 'Retrieving infrastructure details...'
      });

      const outputs = await this.getOutputs();

      this._sendProgress({
        phase: 'terraform',
        step: 'complete',
        progress: 72,
        message: 'Infrastructure provisioning completed',
        outputs
      });

      return outputs;
    } catch (error) {
      this._sendProgress({
        phase: 'terraform',
        step: 'error',
        progress: 0,
        message: error.message,
        error: true
      });
      throw error;
    }
  }

  cancel() {
    if (this.process) {
      console.log('[Terraform] Cancelling process...');
      this.process.kill('SIGTERM');
    }
  }
}

export default TerraformService;
