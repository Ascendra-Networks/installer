import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { NodePoolDialog } from "./NodePoolDialog";
import { Button } from "../../../ui/button";
import { MachineTypeOption, NodePool } from "../../../../types";

const meta: Meta<typeof NodePoolDialog> = {
  title: "Steps/Step2/AWSCloudConfiguration/NodePoolDialog",
  component: NodePoolDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NodePoolDialog>;

const sampleMachineTypes: MachineTypeOption[] = [
  { value: "t3.medium", label: "t3.medium", specs: "2 vCPU, 4 GiB RAM" },
  { value: "t3.large", label: "t3.large", specs: "2 vCPU, 8 GiB RAM" },
  { value: "t3.xlarge", label: "t3.xlarge", specs: "4 vCPU, 16 GiB RAM" },
  { value: "m5.large", label: "m5.large", specs: "2 vCPU, 8 GiB RAM" },
  { value: "m5.xlarge", label: "m5.xlarge", specs: "4 vCPU, 16 GiB RAM" },
  { value: "m5.2xlarge", label: "m5.2xlarge", specs: "8 vCPU, 32 GiB RAM" },
  { value: "c5.large", label: "c5.large", specs: "2 vCPU, 4 GiB RAM" },
  { value: "c5.xlarge", label: "c5.xlarge", specs: "4 vCPU, 8 GiB RAM" },
];

export const CreateNew: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (pool) => console.log("Pool saved:", pool),
    machineTypes: sampleMachineTypes,
  },
};

export const EditExisting: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (pool) => console.log("Pool saved:", pool),
    machineTypes: sampleMachineTypes,
    editPool: {
      id: "pool-1",
      name: "Production Pool",
      machines: [
        { id: "m-1", machineType: "m5.xlarge", nodeCount: 3 },
        { id: "m-2", machineType: "c5.large", nodeCount: 2 },
      ],
      storageClass: "fast-ssd",
      storageSize: 500,
    },
  },
};

export const EmptyMachineTypes: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (pool) => console.log("Pool saved:", pool),
    machineTypes: [],
  },
};

function InteractiveNodePoolDialog() {
  const [open, setOpen] = useState(false);
  const [pools, setPools] = useState<NodePool[]>([]);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Create Node Pool</Button>
      {pools.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Created pools:</p>
          {pools.map((pool) => (
            <div key={pool.id} className="rounded bg-zinc-900 p-3 text-sm text-white">
              {pool.name} — {pool.machines.length} machine type(s)
            </div>
          ))}
        </div>
      )}
      <NodePoolDialog
        open={open}
        onOpenChange={setOpen}
        onSave={(pool) => setPools((prev) => [...prev, pool])}
        machineTypes={sampleMachineTypes}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveNodePoolDialog />,
};

export const WithManyMachines: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (pool) => console.log("Pool saved:", pool),
    machineTypes: sampleMachineTypes,
    editPool: {
      id: "pool-large",
      name: "Large Production Pool",
      machines: [
        { id: "m-1", machineType: "t3.medium", nodeCount: 5 },
        { id: "m-2", machineType: "t3.large", nodeCount: 3 },
        { id: "m-3", machineType: "t3.xlarge", nodeCount: 2 },
        { id: "m-4", machineType: "m5.large", nodeCount: 4 },
        { id: "m-5", machineType: "m5.xlarge", nodeCount: 3 },
        { id: "m-6", machineType: "m5.2xlarge", nodeCount: 2 },
        { id: "m-7", machineType: "c5.large", nodeCount: 6 },
        { id: "m-8", machineType: "c5.xlarge", nodeCount: 4 },
      ],
      storageClass: "fast-ssd",
      storageSize: 1000,
    },
  },
};
