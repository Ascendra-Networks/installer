import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { NodeGroupDialog, ControlPlaneDialog } from "./NodeGroupDialog";
import { Button } from "../../../ui/button";
import { OnPremiseNodeGroup } from "../../../../types";

const meta: Meta<typeof NodeGroupDialog> = {
  title: "Steps/Step2/OnPremiseConfiguration/NodeGroupDialog",
  component: NodeGroupDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NodeGroupDialog>;

export const CreateNew: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (pool) => console.log("Pool saved:", pool),
  },
};

export const EditExisting: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (pool) => console.log("Pool saved:", pool),
    group: {
      groupName: "compute-group",
      sshConfig: {
        user: "ubuntu",
        password: "example-password",
      },
      labels: { role: "compute" },
      taints: [],
      nodes: [
        { ip: "192.168.1.20", hostname: "worker-1" },
        { ip: "192.168.1.21", hostname: "worker-2" },
        { ip: "192.168.1.22", hostname: "worker-3" },
      ],
    },
  },
};

export const CustomTitle: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSave: (group) => console.log("Pool saved:", group),
    title: "GPU Node Pool",
    description: "Configure GPU-enabled worker nodes",
  },
};

function InteractiveNodeGroupDialog() {
  const [open, setOpen] = useState(false);
  const [pools, setPools] = useState<OnPremiseNodeGroup[]>([]);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>New Node Pool</Button>
      {pools.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Created pools:</p>
          {pools.map((pool, i) => (
            <div key={i} className="rounded bg-zinc-900 p-3 text-sm text-white">
              {pool.groupName} — {pool.nodes.length} node(s)
            </div>
          ))}
        </div>
      )}
      <NodeGroupDialog
        open={open}
        onOpenChange={setOpen}
        onSave={(pool) => setPools((prev) => [...prev, pool])}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveNodeGroupDialog />,
};

// ControlPlaneDialog stories
const controlPlaneMeta: Meta<typeof ControlPlaneDialog> = {
  title: "Steps/Step2/OnPremiseConfiguration/ControlPlaneDialog",
  component: ControlPlaneDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const ControlPlaneEmpty: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <ControlPlaneDialog
        open={open}
        onOpenChange={setOpen}
        onSave={(nodes, sshConfig) =>
          console.log("Control plane saved:", { nodes, sshConfig })
        }
      />
    );
  },
};

export const ControlPlaneWithNode: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <ControlPlaneDialog
        open={open}
        onOpenChange={setOpen}
        node={{ ip: "10.0.1.10", hostname: "master-1" }}
        sshConfig={{
          user: "ubuntu",
          password: "example-password",
        }}
        onSave={(node, sshConfig) =>
          console.log("Control plane saved:", { node, sshConfig })
        }
        isEditing
      />
    );
  },
};
