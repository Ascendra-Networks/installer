const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";

class WizardStateService {
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
   * Load persisted wizard session state from the backend
   */
  async get(): Promise<Record<string, unknown> | null> {
    return this.fetch<Record<string, unknown> | null>("/api/wizard/state");
  }

  /**
   * Persist wizard session state to the backend
   */
  async save(state: Record<string, unknown>): Promise<void> {
    await this.fetch("/api/wizard/state", {
      method: "POST",
      body: JSON.stringify(state),
    });
  }

  /**
   * Clear persisted wizard session state
   */
  async clear(): Promise<void> {
    await this.fetch("/api/wizard/state", { method: "DELETE" });
  }

  /**
   * Write ansible group_vars/all.yml immediately from the current wizard config.
   * Call this whenever proxy settings change so the file is always up-to-date,
   * without waiting for the full deployment to start.
   */
  async applyAnsibleConfig(config: {
    cloudProvider?: string | null;
    clusterConfig?: unknown;
    onPremiseConfig?: unknown;
    selectedComponents?: unknown;
  }): Promise<void> {
    await this.fetch("/api/wizard/ansible-config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }
}

export const wizardStateService = new WizardStateService();
