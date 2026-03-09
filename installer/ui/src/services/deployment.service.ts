import { CloudProvider } from "../types";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";

class DeploymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new deployment
   */
  async create(config: {
    cloudProvider: CloudProvider;
    clusterConfig: unknown;
    onPremiseConfig?: unknown;
    selectedComponents: unknown;
  }): Promise<{ id: string }> {
    return this.fetch<{ id: string }>("/api/deployment/create", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  /**
   * Get deployment by id
   */
  async get(id: string): Promise<unknown> {
    return this.fetch<unknown>(`/api/deployment/${id}`);
  }

  /**
   * List all deployments
   */
  async list(): Promise<unknown[]> {
    return this.fetch<unknown[]>("/api/deployment/list");
  }

  /**
   * Delete a deployment
   */
  async delete(id: string): Promise<void> {
    await this.fetch<void>(`/api/deployment/${id}`, { method: "DELETE" });
  }

  /**
   * Get access URLs for a deployed cluster.
   * When the master IP is known (from the Ansible inventory), links point
   * directly to that host — works for both AWS and on-premise deployments.
   */
  getAccessUrls(clusterName: string, masterIp?: string | null): Record<string, string> {
    const base = masterIp ? `http://${masterIp}` : `https://${clusterName}.ascendra.io`;
    return {
      dashboard: `${base}`,
      api: `${base}:8080`,
      monitoring: `${base}:3000`,
    };
  }
}

export const deploymentService = new DeploymentService();
