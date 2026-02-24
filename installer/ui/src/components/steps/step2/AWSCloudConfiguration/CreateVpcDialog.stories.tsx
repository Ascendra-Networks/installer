import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CreateVpcDialog } from "./CreateVpcDialog";
import { Button } from "../../../ui/button";

const meta: Meta<typeof CreateVpcDialog> = {
  title: "Steps/Step2/AWSCloudConfiguration/CreateVpcDialog",
  component: CreateVpcDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CreateVpcDialog>;

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    region: "us-east-1",
    cloudProvider: "aws",
    clusterName: "production",
    onVpcCreated: (vpcId) => console.log("VPC created:", vpcId),
  },
};

export const WithClusterName: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    region: "eu-west-1",
    cloudProvider: "aws",
    clusterName: "my-cluster",
    onVpcCreated: (vpcId) => console.log("VPC created:", vpcId),
  },
};

export const NoClusterName: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    region: "us-west-2",
    cloudProvider: "aws",
    onVpcCreated: (vpcId) => console.log("VPC created:", vpcId),
  },
};

function InteractiveVpcDialog() {
  const [open, setOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Open Create VPC Dialog</Button>
      {lastCreated && (
        <p className="text-sm text-green-400">Last created VPC: {lastCreated}</p>
      )}
      <CreateVpcDialog
        open={open}
        onOpenChange={setOpen}
        region="us-east-1"
        cloudProvider="aws"
        clusterName="demo-cluster"
        onVpcCreated={(vpcId) => {
          setLastCreated(vpcId);
          setOpen(false);
        }}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveVpcDialog />,
};
