import { Component } from "../types";

/**
 * Catalog of installable components (e.g. Management Dashboard).
 * Used in step 4 (component selection) and step 5 (install progress).
 */
export const AVAILABLE_COMPONENTS: Component[] = [
  {
    id: "dashboard",
    name: "Management Dashboard",
    description:
      "Web-based dashboard for monitoring and managing your Ascendra cluster, including data collection and metrics visualization",
    required: false,
    dependencies: [],
    resourceRequirements: {
      cpu: "500m",
      memory: "512Mi",
      storage: "5Gi",
    },
  },
];

export function getAvailableComponents(): Component[] {
  return AVAILABLE_COMPONENTS;
}
