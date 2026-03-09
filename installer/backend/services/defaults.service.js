import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service to manage shared cluster defaults
 * Reads from config/cluster-defaults.json which is also used by Terraform
 */
class DefaultsService {
  constructor() {
    this.defaultsPath = path.resolve(
      __dirname,
      '../../../config/cluster-defaults.json'
    );
    this.defaults = null;
    this.loadDefaults();
  }

  /**
   * Load defaults from JSON file
   */
  loadDefaults() {
    try {
      if (!fs.existsSync(this.defaultsPath)) {
        console.error(`[Defaults] Config file not found: ${this.defaultsPath}`);
        this.defaults = this.getFallbackDefaults();
        return;
      }

      const content = fs.readFileSync(this.defaultsPath, 'utf8');
      this.defaults = JSON.parse(content);
      console.log(`[Defaults] Loaded cluster defaults from: ${this.defaultsPath}`);
    } catch (error) {
      console.error('[Defaults] Error loading defaults:', error.message);
      this.defaults = this.getFallbackDefaults();
    }
  }

  /**
   * Get fallback defaults if config file is not available
   */
  getFallbackDefaults() {
    return {
      version: '1.0.0',
      description: 'Fallback defaults',
      network: {
        vpc: {
          cidr: '10.0.0.0/16',
          nameSuffix: '-vpc',
          enableDnsHostnames: true,
          enableDnsSupport: true
        },
        subnet: {
          cidr: '10.0.1.0/24',
          nameSuffix: '-subnet',
          mapPublicIpOnLaunch: true
        }
      },
      compute: {
        master: {
          instanceType: 't3.xlarge',
          diskSize: 100,
          diskType: 'gp3'
        },
        worker: {
          defaultInstanceType: 't3.xlarge',
          diskSize: 100,
          diskType: 'gp3'
        }
      },
      ssh: {
        keyAlgorithm: 'RSA',
        keyBits: 4096
      },
      tags: {
        managedBy: 'Ascendra-Installer'
      }
    };
  }

  /**
   * Reload defaults from file (useful after config changes)
   */
  reload() {
    console.log('[Defaults] Reloading cluster defaults...');
    this.loadDefaults();
  }

  /**
   * Get all defaults
   */
  getAll() {
    return this.defaults;
  }

  /**
   * Get network defaults
   */
  getNetworkDefaults() {
    return this.defaults.network;
  }

  /**
   * Get VPC defaults
   */
  getVpcDefaults() {
    return this.defaults.network.vpc;
  }

  /**
   * Get subnet defaults
   */
  getSubnetDefaults() {
    return this.defaults.network.subnet;
  }

  /**
   * Get compute defaults
   */
  getComputeDefaults() {
    return this.defaults.compute;
  }

  /**
   * Get master node defaults
   */
  getMasterDefaults() {
    return this.defaults.compute.master;
  }

  /**
   * Get worker node defaults
   */
  getWorkerDefaults() {
    return this.defaults.compute.worker;
  }

  /**
   * Get tags defaults
   */
  getTagsDefaults() {
    return this.defaults.tags;
  }

  /**
   * Get generated name with suffix for a resource
   */
  getResourceName(clusterName, resourceType) {
    const suffixes = {
      vpc: this.defaults.network.vpc.nameSuffix,
      subnet: this.defaults.network.subnet.nameSuffix,
      igw: '-igw',
      rt: '-rt',
      sg: '-sg',
      master: '-master',
      worker: '-worker'
    };

    const suffix = suffixes[resourceType] || '';
    return `${clusterName}${suffix}`;
  }
}

export default new DefaultsService();


