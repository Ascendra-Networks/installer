import { RegionOption, MachineTypeOption } from "../types";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";

class AWSService {
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
   * Get AWS regions
   */
  async getRegions(): Promise<RegionOption[]> {
    return this.fetch<RegionOption[]>(`/api/aws/region/list`);
  }

  /**
   * Get VPCs for a region
   */
  async getVPCs(region?: string): Promise<RegionOption[]> {
    const params = region ? `?region=${encodeURIComponent(region)}` : "";
    return this.fetch<RegionOption[]>(`/api/aws/vpc/list${params}`);
  }

  /**
   * Get subnets for a region and optional VPC
   */
  async getSubnets(region?: string, vpcId?: string): Promise<RegionOption[]> {
    const params = new URLSearchParams();
    if (region) params.append("region", region);
    if (vpcId) params.append("vpcId", vpcId);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.fetch<RegionOption[]>(`/api/aws/subnet/list${queryString}`);
  }

  /**
   * Get machine types for a region
   */
  async getMachineTypes(region?: string): Promise<MachineTypeOption[]> {
    const params = region ? `?region=${encodeURIComponent(region)}` : "";
    return this.fetch<MachineTypeOption[]>(`/api/aws/machine-type/list${params}`);
  }

  /**
   * Get availability zones for a region
   */
  async getAvailabilityZones(region: string): Promise<RegionOption[]> {
    return this.fetch<RegionOption[]>(
      `/api/aws/availability-zone/list?region=${encodeURIComponent(region)}`
    );
  }

  /**
   * Validate AWS credentials
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    suggestion?: string;
  }> {
    try {
      return await this.fetch<{
        valid: boolean;
        error?: string;
        suggestion?: string;
      }>("/api/aws/credential/validate");
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  /**
   * Clear AWS cache (optional key to clear a specific entry)
   */
  async clearCache(key?: string): Promise<void> {
    await this.fetch("/api/aws/cache/clear", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
  }
}

export const awsService = new AWSService();
