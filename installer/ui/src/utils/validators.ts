import { ClusterConfig } from "../types";

export function validateClusterName(name: string): string | null {
  if (!name) return "Cluster name is required";
  if (name.length < 3) return "Cluster name must be at least 3 characters";
  if (name.length > 63) return "Cluster name must be less than 63 characters";
  if (!/^[a-z0-9-]+$/.test(name)) {
    return "Cluster name must contain only lowercase letters, numbers, and hyphens";
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    return "Cluster name cannot start or end with a hyphen";
  }
  return null;
}

export function validateClusterConfig(config: ClusterConfig): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameError = validateClusterName(config.name);
  if (nameError) {
    errors.name = nameError;
  }

  if (!config.region) {
    errors.region = "Region is required";
  }

  if (!config.vpc) {
    errors.vpc = "VPC is required";
  }

  if (!config.subnet) {
    errors.subnet = "Subnet is required";
  }

  if (!config.nodePools || config.nodePools.length === 0) {
    errors.nodePools = "At least one node pool is required";
  }

  return errors;
}

export function isClusterConfigValid(config: ClusterConfig): boolean {
  const errors = validateClusterConfig(config);
  return Object.keys(errors).length === 0;
}

