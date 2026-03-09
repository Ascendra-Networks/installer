import type { Meta, StoryObj } from "@storybook/react";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { NodePool } from "../../../../types";

const meta: Meta<typeof ConfigurationSummary> = {
  title: "Steps/Step2/AWSCloudConfiguration/ConfigurationSummary",
  component: ConfigurationSummary,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ConfigurationSummary>;

const samplePools: NodePool[] = [
  {
    id: "pool-1",
    name: "Production Pool",
    machines: [
      { id: "m1", machineType: "t3.medium", nodeCount: 3 },
      { id: "m2", machineType: "t3.large", nodeCount: 2 },
    ],
    storageClass: "standard",
    storageSize: 100,
  },
  {
    id: "pool-2",
    name: "Compute Pool",
    machines: [
      { id: "m3", machineType: "c5.xlarge", nodeCount: 5 },
    ],
    storageClass: "fast-ssd",
    storageSize: 200,
  },
];

export const Default: Story = {
  args: {
    nodePools: samplePools,
    region: "us-east-1",
    clusterName: "production-cluster",
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

export const Minimal: Story = {
  args: {
    nodePools: [
      {
        id: "pool-1",
        name: "Default Pool",
        machines: [{ id: "m1", machineType: "t3.medium", nodeCount: 1 }],
        storageClass: "standard",
        storageSize: 50,
      },
    ],
    region: "eu-west-1",
    clusterName: "test-cluster",
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

export const LargeDeployment: Story = {
  args: {
    nodePools: Array.from({ length: 8 }, (_, i) => ({
      id: `pool-${i + 1}`,
      name: `Pool ${i + 1}`,
      machines: [
        { id: `m-${i}-1`, machineType: "t3.large", nodeCount: 5 },
        { id: `m-${i}-2`, machineType: "t3.xlarge", nodeCount: 3 },
      ],
      storageClass: "standard" as const,
      storageSize: 200,
    })),
    region: "ap-southeast-1",
    clusterName: "enterprise-cluster",
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};
