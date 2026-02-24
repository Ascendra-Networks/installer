import fs from 'fs';
import yaml from 'js-yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * On-Premise deployment service
 * Handles validation, SSH key generation, and configuration for on-premise deployments
 */
class OnPremiseService {
  /**
   * Validate IP address format
   */
  validateIPAddress(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      return { valid: false, error: `Invalid IP address format: ${ip}` };
    }
    
    // Validate IPv4 octets
    if (ipv4Regex.test(ip)) {
      const octets = ip.split('.');
      for (const octet of octets) {
        const num = parseInt(octet, 10);
        if (num < 0 || num > 255) {
          return { valid: false, error: `Invalid IPv4 address: ${ip} (octet out of range)` };
        }
      }
    }
    
    return { valid: true };
  }

  /**
   * Validate hostname format
   */
  validateHostname(hostname) {
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    
    if (!hostnameRegex.test(hostname)) {
      return { valid: false, error: `Invalid hostname format: ${hostname}` };
    }
    
    return { valid: true };
  }

  /**
   * Validate node configuration
   */
  validateNode(node, nodeType = 'node') {
    if (!node.ip) {
      return { valid: false, error: `${nodeType} missing IP address` };
    }
    
    const ipValidation = this.validateIPAddress(node.ip);
    if (!ipValidation.valid) {
      return ipValidation;
    }
    
    if (node.hostname) {
      const hostnameValidation = this.validateHostname(node.hostname);
      if (!hostnameValidation.valid) {
        return hostnameValidation;
      }
    }

    if (node.osType && !['ubuntu', 'suse'].includes(node.osType)) {
      return { valid: false, error: `${nodeType} has invalid osType: '${node.osType}' (must be 'ubuntu' or 'suse')` };
    }
    if (!node.osType) {
      node.osType = 'ubuntu';
    }

    // Validate per-node environment variables if provided
    if (node.envVars && Array.isArray(node.envVars)) {
      const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;
      const seenKeys = new Set();
      for (const envVar of node.envVars) {
        if (!envVar.key || !envVar.key.trim()) {
          continue;
        }
        if (!envKeyRegex.test(envVar.key)) {
          return {
            valid: false,
            error: `Invalid environment variable key on ${nodeType} (${node.ip}): '${envVar.key}' (must match [A-Za-z_][A-Za-z0-9_]*)`
          };
        }
        if (seenKeys.has(envVar.key)) {
          return {
            valid: false,
            error: `Duplicate environment variable key on ${nodeType} (${node.ip}): '${envVar.key}'`
          };
        }
        seenKeys.add(envVar.key);
      }
    }

    // node.sshConfig is optional (per-node override); no required validation

    return { valid: true };
  }

  /**
   * Validate node group configuration
   */
  validateNodeGroup(group, groupIndex) {
    if (!group.groupName) {
      return { valid: false, error: `Node group ${groupIndex} missing groupName` };
    }
    
    // Validate SSH config for the group
    if (!group.sshConfig) {
      return { valid: false, error: `Node group ${group.groupName} missing sshConfig` };
    }
    
    if (!group.sshConfig.user) {
      return { valid: false, error: `Node group ${group.groupName} missing sshConfig.user` };
    }
    
    if (!group.sshConfig.password) {
      return {
        valid: false,
        error: `Node group ${group.groupName}: must provide sshConfig.password`
      };
    }
    
    if (!group.nodes || !Array.isArray(group.nodes) || group.nodes.length === 0) {
      return { valid: false, error: `Node group ${group.groupName} has no nodes` };
    }
    
    // Validate each node in the group
    for (let i = 0; i < group.nodes.length; i++) {
      const nodeValidation = this.validateNode(
        group.nodes[i],
        `Node ${i} in group ${group.groupName}`
      );
      if (!nodeValidation.valid) {
        return nodeValidation;
      }
    }
    
    // Validate taints format if provided
    if (group.taints && Array.isArray(group.taints)) {
      for (const taint of group.taints) {
        if (!taint.key || !taint.effect) {
          return {
            valid: false,
            error: `Invalid taint in group ${group.groupName}: must have 'key' and 'effect'`
          };
        }
        if (!['NoSchedule', 'PreferNoSchedule', 'NoExecute'].includes(taint.effect)) {
          return {
            valid: false,
            error: `Invalid taint effect in group ${group.groupName}: ${taint.effect}`
          };
        }
      }
    }
    
    // Validate environment variables if provided
    if (group.envVars && Array.isArray(group.envVars)) {
      const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;
      const seenKeys = new Set();
      for (const envVar of group.envVars) {
        if (!envVar.key || !envVar.key.trim()) {
          continue;
        }
        if (!envKeyRegex.test(envVar.key)) {
          return {
            valid: false,
            error: `Invalid environment variable key in group ${group.groupName}: '${envVar.key}' (must match [A-Za-z_][A-Za-z0-9_]*)`
          };
        }
        if (seenKeys.has(envVar.key)) {
          return {
            valid: false,
            error: `Duplicate environment variable key in group ${group.groupName}: '${envVar.key}'`
          };
        }
        seenKeys.add(envVar.key);
      }
    }
    
    return { valid: true };
  }

  /**
   * Validate complete on-premise configuration
   */
  validateConfig(config) {
    console.log('[OnPremise] Validating configuration...');
    
    // Validate cluster name
    if (!config.clusterName || typeof config.clusterName !== 'string') {
      return { valid: false, error: 'Missing or invalid clusterName' };
    }
    
    if (!/^[a-z0-9-]+$/.test(config.clusterName)) {
      return {
        valid: false,
        error: 'clusterName must contain only lowercase letters, numbers, and hyphens'
      };
    }
    
    // Validate control plane
    if (!config.controlPlane || !config.controlPlane.nodes) {
      return { valid: false, error: 'Missing controlPlane.nodes' };
    }
    
    if (!Array.isArray(config.controlPlane.nodes) || config.controlPlane.nodes.length === 0) {
      return { valid: false, error: 'controlPlane.nodes must be a non-empty array' };
    }
    
    // Validate control plane SSH config
    if (!config.controlPlane.sshConfig) {
      return { valid: false, error: 'Missing controlPlane.sshConfig' };
    }
    
    if (!config.controlPlane.sshConfig.user) {
      return { valid: false, error: 'Missing controlPlane.sshConfig.user' };
    }
    
    if (!config.controlPlane.sshConfig.password) {
      return {
        valid: false,
        error: 'Control plane: must provide sshConfig.password'
      };
    }
    
    // Validate control plane nodes
    for (let i = 0; i < config.controlPlane.nodes.length; i++) {
      const nodeValidation = this.validateNode(
        config.controlPlane.nodes[i],
        `Control plane node ${i}`
      );
      if (!nodeValidation.valid) {
        return nodeValidation;
      }
    }
    
    // Validate control plane environment variables if provided
    if (config.controlPlane.envVars && Array.isArray(config.controlPlane.envVars)) {
      const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;
      const seenKeys = new Set();
      for (const envVar of config.controlPlane.envVars) {
        if (!envVar.key || !envVar.key.trim()) {
          continue;
        }
        if (!envKeyRegex.test(envVar.key)) {
          return {
            valid: false,
            error: `Invalid control plane environment variable key: '${envVar.key}' (must match [A-Za-z_][A-Za-z0-9_]*)`
          };
        }
        if (seenKeys.has(envVar.key)) {
          return {
            valid: false,
            error: `Duplicate control plane environment variable key: '${envVar.key}'`
          };
        }
        seenKeys.add(envVar.key);
      }
    }
    
    // Validate worker nodes
    if (!config.workerNodes || !Array.isArray(config.workerNodes)) {
      return { valid: false, error: 'Missing or invalid workerNodes array' };
    }
    
    if (config.workerNodes.length === 0) {
      return { valid: false, error: 'Must have at least one worker node group' };
    }
    
    // Validate each worker group
    for (let i = 0; i < config.workerNodes.length; i++) {
      const groupValidation = this.validateNodeGroup(config.workerNodes[i], i);
      if (!groupValidation.valid) {
        return groupValidation;
      }
    }
    
    // Check for duplicate IPs
    const allIps = new Set();
    const duplicates = [];
    
    config.controlPlane.nodes.forEach(node => {
      if (allIps.has(node.ip)) {
        duplicates.push(node.ip);
      }
      allIps.add(node.ip);
    });
    
    config.workerNodes.forEach(group => {
      group.nodes.forEach(node => {
        if (allIps.has(node.ip)) {
          duplicates.push(node.ip);
        }
        allIps.add(node.ip);
      });
    });
    
    if (duplicates.length > 0) {
      return {
        valid: false,
        error: `Duplicate IP addresses found: ${duplicates.join(', ')}`
      };
    }
    
    // Validate cluster-wide environment variables if provided
    if (config.envVars && Array.isArray(config.envVars)) {
      const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;
      const seenKeys = new Set();
      for (const envVar of config.envVars) {
        if (!envVar.key || !envVar.key.trim()) {
          continue;
        }
        if (!envKeyRegex.test(envVar.key)) {
          return {
            valid: false,
            error: `Invalid cluster environment variable key: '${envVar.key}' (must match [A-Za-z_][A-Za-z0-9_]*)`
          };
        }
        if (seenKeys.has(envVar.key)) {
          return {
            valid: false,
            error: `Duplicate cluster environment variable key: '${envVar.key}'`
          };
        }
        seenKeys.add(envVar.key);
      }
    }
    
    console.log('[OnPremise] Configuration validation passed');
    return { valid: true };
  }

  /**
   * Parse YAML configuration file
   */
  parseYAML(yamlContent) {
    try {
      const config = yaml.load(yamlContent);
      return { success: true, config };
    } catch (error) {
      console.error('[OnPremise] YAML parse error:', error.message);
      return {
        success: false,
        error: `Failed to parse YAML: ${error.message}`
      };
    }
  }

  /**
   * Load and validate YAML configuration from file
   */
  loadYAMLConfig(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `File not found: ${filePath}` };
      }
      
      const yamlContent = fs.readFileSync(filePath, 'utf8');
      const parseResult = this.parseYAML(yamlContent);
      
      if (!parseResult.success) {
        return parseResult;
      }
      
      const validation = this.validateConfig(parseResult.config);
      
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      
      return { success: true, config: parseResult.config };
    } catch (error) {
      console.error('[OnPremise] Error loading YAML config:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test SSH connectivity to a node using password authentication
   */
  async testSSHConnection(ip, user, password, timeout = 10) {
    console.log(`[OnPremise] Testing SSH connection to ${user}@${ip}`);
    
    try {
      const command = `sshpass -p '${password.replace(/'/g, "'\\''")}' ssh -o ConnectTimeout=${timeout} -o StrictHostKeyChecking=no ${user}@${ip} "echo 'SSH connection successful'"`;
      
      const { stdout } = await execAsync(command, { timeout: (timeout + 5) * 1000 });
      
      if (stdout.includes('SSH connection successful')) {
        console.log(`[OnPremise] SSH connection to ${ip} successful`);
        return { success: true, ip, message: 'SSH connection successful' };
      } else {
        return { success: false, ip, error: 'Unexpected SSH response' };
      }
    } catch (error) {
      console.error(`[OnPremise] SSH connection to ${ip} failed:`, error.message);
      return {
        success: false,
        ip,
        error: error.message || 'SSH connection failed'
      };
    }
  }

  /**
   * Test SSH connectivity to all nodes in configuration
   */
  async testAllSSHConnections(config, timeout = 10) {
    console.log('[OnPremise] Testing SSH connectivity to all nodes...');
    
    const results = {
      success: true,
      tested: 0,
      passed: 0,
      failed: 0,
      nodes: []
    };
    
    const cpSSHConfig = config.controlPlane.sshConfig;
    if (!cpSSHConfig || !cpSSHConfig.password) {
      return {
        success: false,
        error: 'No SSH password provided for control plane'
      };
    }
    
    for (const node of config.controlPlane.nodes) {
      const result = await this.testSSHConnection(
        node.ip, 
        cpSSHConfig.user, 
        cpSSHConfig.password, 
        timeout
      );
      results.nodes.push({ ...result, type: 'master', hostname: node.hostname });
      results.tested++;
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
        results.success = false;
      }
    }
    
    for (const group of config.workerNodes) {
      const groupSSHConfig = group.sshConfig;
      
      if (!groupSSHConfig || !groupSSHConfig.password) {
        console.warn(`[OnPremise] Skipping group ${group.groupName}: no SSH password`);
        continue;
      }
      
      for (const node of group.nodes) {
        const result = await this.testSSHConnection(
          node.ip, 
          groupSSHConfig.user, 
          groupSSHConfig.password, 
          timeout
        );
        results.nodes.push({
          ...result,
          type: 'worker',
          group: group.groupName,
          hostname: node.hostname
        });
        results.tested++;
        if (result.success) {
          results.passed++;
        } else {
          results.failed++;
          results.success = false;
        }
      }
    }
    
    console.log(`[OnPremise] SSH test complete: ${results.passed}/${results.tested} nodes accessible`);
    
    return results;
  }

  /**
   * Get YAML configuration template
   */
  getConfigTemplate() {
    return `# On-Premise Cluster Configuration Template
# Generated by Ascendra Installer

clusterName: "my-onprem-cluster"

controlPlane:
  sshConfig:
    user: "ubuntu"  # Use "root" for SUSE nodes
    password: "your-ssh-password"
  nodes:
    - ip: "192.168.1.10"
      hostname: "master-1"  # optional
      osType: "ubuntu"      # "ubuntu" or "suse" per node
    # Add more control plane nodes for HA
    # - ip: "192.168.1.11"
    #   hostname: "master-2"
    #   osType: "suse"

workerNodes:
  # You can define multiple node groups with different labels and taints
  - groupName: "compute-group"
    sshConfig:
      user: "ubuntu"
      password: "your-ssh-password"
    labels:
      node-role: "compute"
      environment: "production"
    taints: []  # No taints for this group
    nodes:
      - ip: "192.168.1.20"
        hostname: "worker-1"
        osType: "ubuntu"
      - ip: "192.168.1.21"
        hostname: "worker-2"
        osType: "suse"     # Mixed OS example
  
  # Example: Storage node group with taints
  # - groupName: "storage-group"
  #   sshConfig:
  #     user: "root"
  #     password: "your-ssh-password"
  #   labels:
  #     node-role: "storage"
  #   taints:
  #     - key: "storage"
  #       value: "true"
  #       effect: "NoSchedule"
  #   nodes:
  #     - ip: "192.168.1.30"
  #       hostname: "storage-1"
  #       osType: "suse"
`;
  }
}

export default new OnPremiseService();

