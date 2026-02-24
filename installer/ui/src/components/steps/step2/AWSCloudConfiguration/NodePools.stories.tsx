import type { Meta, StoryObj } from "@storybook/react";
import { NodePools } from "./NodePools";
import { NodePool } from "../../../../types";

const meta: Meta<typeof NodePools> = {
  title: "Steps/Step2/AWSCloudConfiguration/NodePools",
  component: NodePools,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof NodePools>;

const samplePools: NodePool[] = [
  {
    id: "pool-1",
    name: "Production Pool",
    machines: [
      { id: "m1", machineType: "t3.medium", nodeCount: 3 },
      { id: "m2", machineType: "t3.large", nodeCount: 2 },
    ],
    storageClass: "gp3",
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
  {
    id: "pool-3",
    name: "Memory Optimized",
    machines: [
      { id: "m4", machineType: "r5.large", nodeCount: 2 },
      { id: "m5", machineType: "r5.xlarge", nodeCount: 1 },
    ],
    storageClass: "balanced",
    storageSize: 150,
  },
];

export const Default: Story = {
  args: {
    nodePools: samplePools,
    onAddPool: () => console.log("Add pool"),
    onEditPool: (pool) => console.log("Edit pool:", pool),
    onRemovePool: (id) => console.log("Remove pool:", id),
    regionSelected: true,
    loadingMachineTypes: false,
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    nodePools: [],
    onAddPool: () => console.log("Add pool"),
    onEditPool: (pool) => console.log("Edit pool:", pool),
    onRemovePool: (id) => console.log("Remove pool:", id),
    regionSelected: true,
    loadingMachineTypes: false,
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    nodePools: [],
    onAddPool: () => console.log("Add pool"),
    onEditPool: (pool) => console.log("Edit pool:", pool),
    onRemovePool: (id) => console.log("Remove pool:", id),
    regionSelected: true,
    loadingMachineTypes: true,
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

export const NoRegionSelected: Story = {
  args: {
    nodePools: [],
    onAddPool: () => console.log("Add pool"),
    onEditPool: (pool) => console.log("Edit pool:", pool),
    onRemovePool: (id) => console.log("Remove pool:", id),
    regionSelected: false,
    loadingMachineTypes: false,
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

const manyPools = Array.from({ length: 10 }, (_, i) => ({
  id: `pool-${i + 1}`,
  name: `Node Pool ${i + 1}`,
  machines: [
    { id: `m-${i}-1`, machineType: "t3.medium", nodeCount: 2 },
    { id: `m-${i}-2`, machineType: "t3.large", nodeCount: 1 },
  ],
  storageClass: i % 3 === 0 ? "gp3" : i % 3 === 1 ? "fast-ssd" : "balanced",
  storageSize: 100 + i * 10,
})) as NodePool[];

export const ManyPools: Story = {
  args: {
    nodePools: manyPools,
    onAddPool: () => console.log("Add pool"),
    onEditPool: (pool) => console.log("Edit pool:", pool),
    onRemovePool: (id) => console.log("Remove pool:", id),
    regionSelected: true,
    loadingMachineTypes: false,
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};
