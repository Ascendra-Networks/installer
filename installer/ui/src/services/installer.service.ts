import {
  CloudProvider,
  Component,
  RegionOption,
  MachineTypeOption,
  ProviderOption,
} from "../types";
import { io, Socket } from "socket.io-client";

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001';

// ============================================
// Static Constants
// ============================================

export const CLOUD_PROVIDERS: ProviderOption[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Deploy on AWS cloud infrastructure",
    icon: "aws",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    description: "Deploy on Azure cloud platform",
    icon: "azure",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    description: "Deploy on Google Cloud infrastructure",
    icon: "gcp",
  },
  {
    id: "on-premise",
    name: "On-Premises",
    description: "Deploy on your own infrastructure",
    icon: "server",
  },
];

export const AVAILABLE_COMPONENTS: Component[] = [
  {
    id: "dashboard",
    name: "Management Dashboard",
    description: "Web-based dashboard for monitoring and managing your Ascendra cluster, including data collection and metrics visualization",
    required: false,
    dependencies: [],
    resourceRequirements: {
      cpu: "500m",
      memory: "512Mi",
      storage: "5Gi",
    },
  },
];

// ============================================
// WebSocket Management
// ============================================

// WebSocket instance
let socket: Socket | null = null;

/**
 * Initialize WebSocket connection
 */
export function initializeWebSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to backend');
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from backend');
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  }
  
  return socket;
}

/**
 * Get WebSocket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Close WebSocket connection
 */
export function closeWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

// ============================================
// API Service
// ============================================

class InstallerService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Generic fetch wrapper
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get cloud providers (static data)
   */
  getProviders(): ProviderOption[] {
    return CLOUD_PROVIDERS;
  }

  /**
   * Get regions for a provider
   */
  async getRegions(_provider: CloudProvider): Promise<RegionOption[]> {
    return this.fetch<RegionOption[]>(`/api/aws/region/list`);
  }

  /**
   * Get VPCs for a provider
   * @param provider Cloud provider
   * @param region AWS region (required for AWS)
   */
  async getVPCs(_provider: CloudProvider, region?: string): Promise<RegionOption[]> {
    const params = region ? `?region=${encodeURIComponent(region)}` : '';
    return this.fetch<RegionOption[]>(`/api/aws/vpc/list${params}`);
  }

  /**
   * Get subnets for a provider
   * @param provider Cloud provider
   * @param region AWS region (required for AWS)
   * @param vpcId VPC ID to filter by (optional for AWS)
   */
  async getSubnets(_provider: CloudProvider, region?: string, vpcId?: string): Promise<RegionOption[]> {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (vpcId) params.append('vpcId', vpcId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.fetch<RegionOption[]>(`/api/aws/subnet/list${queryString}`);
  }

  /**
   * Get machine types for a provider
   * @param provider Cloud provider
   * @param region AWS region (required for AWS)
   */
  async getMachineTypes(_provider: CloudProvider, region?: string): Promise<MachineTypeOption[]> {
    const params = region ? `?region=${encodeURIComponent(region)}` : '';
    return this.fetch<MachineTypeOption[]>(`/api/aws/machine-type/list${params}`);
  }

  /**
   * Get availability zones for an AWS region
   */
  async getAvailabilityZones(region: string): Promise<RegionOption[]> {
    return this.fetch<RegionOption[]>(`/api/aws/availability-zone/list?region=${encodeURIComponent(region)}`);
  }

  /**
   * Validate AWS credentials
   */
  async validateAWSCredentials(): Promise<{ valid: boolean; error?: string; suggestion?: string }> {
    try {
      return await this.fetch<{ valid: boolean; error?: string; suggestion?: string }>('/api/aws/credential/validate');
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  /**
   * Clear AWS cache
   */
  async clearAWSCache(key?: string): Promise<void> {
    await this.fetch('/api/aws/cache/clear', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  /**
   * Get available components (static data)
   */
  getAvailableComponents(): Component[] {
    return AVAILABLE_COMPONENTS;
  }

  /**
   * Validate cluster name
   */
  validateClusterName(name: string): string | null {
    if (!name) return "Cluster name is required";
    if (name.length < 3) return "Cluster name must be at least 3 characters";
    if (name.length > 63) return "Cluster name must be less than 63 characters";
    if (!/^[a-z0-9-]+$/.test(name)) {
      return "Cluster name must contain only lowercase letters, numbers, and hyphens";
    }
    return null;
  }

  /**
   * Create a new deployment
   */
  async createDeployment(config: {
    cloudProvider: CloudProvider;
    clusterConfig: any;
    onPremiseConfig?: any;
    selectedComponents: any;
  }): Promise<{ id: string }> {
    return this.fetch<{ id: string }>('/api/deployment/create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get deployment status
   */
  async getDeployment(id: string): Promise<any> {
    return this.fetch<any>(`/api/deployment/${id}`);
  }

  /**
   * Get all deployments
   */
  async getAllDeployments(): Promise<any[]> {
    return this.fetch<any[]>('/api/deployment/list');
  }

  /**
   * Delete a deployment
   */
  async deleteDeployment(id: string): Promise<void> {
    await this.fetch<void>(`/api/deployment/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Load persisted wizard session state from the backend
   */
  async getWizardState(): Promise<any | null> {
    return this.fetch<any | null>('/api/wizard/state');
  }

  /**
   * Persist wizard session state to the backend
   */
  async saveWizardState(state: Record<string, any>): Promise<void> {
    await this.fetch('/api/wizard/state', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  }

  /**
   * Clear persisted wizard session state
   */
  async clearWizardState(): Promise<void> {
    await this.fetch('/api/wizard/state', { method: 'DELETE' });
  }

  /**
   * Get access URLs for a deployed cluster
   */
  getAccessUrls(clusterName: string): Record<string, string> {
    return {
      dashboard: `https://dashboard.${clusterName}.ascendra.io`,
      api: `https://api.${clusterName}.ascendra.io`,
      monitoring: `https://monitoring.${clusterName}.ascendra.io`,
    };
  }
}

// Export singleton instance
export const installerService = new InstallerService();
