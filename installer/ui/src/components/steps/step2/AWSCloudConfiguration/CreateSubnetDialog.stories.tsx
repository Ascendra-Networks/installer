import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CreateSubnetDialog } from "./CreateSubnetDialog";
import { Button } from "../../../ui/button";

const meta: Meta<typeof CreateSubnetDialog> = {
  title: "Steps/Step2/AWSCloudConfiguration/CreateSubnetDialog",
  component: CreateSubnetDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CreateSubnetDialog>;

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    region: "us-east-1",
    vpcId: "vpc-0abc123def456",
    cloudProvider: "aws",
    clusterName: "production",
    onSubnetCreated: (subnetId) => console.log("Subnet created:", subnetId),
  },
};

export const WithClusterName: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    region: "eu-west-1",
    vpcId: "vpc-0abc123def456",
    cloudProvider: "aws",
    clusterName: "my-cluster",
    onSubnetCreated: (subnetId) => console.log("Subnet created:", subnetId),
  },
};

function InteractiveSubnetDialog() {
  const [open, setOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Open Create Subnet Dialog</Button>
      {lastCreated && (
        <p className="text-sm text-green-400">Last created Subnet: {lastCreated}</p>
      )}
      <CreateSubnetDialog
        open={open}
        onOpenChange={setOpen}
        region="us-east-1"
        vpcId="vpc-0abc123"
        cloudProvider="aws"
        clusterName="demo-cluster"
        onSubnetCreated={(subnetId) => {
          setLastCreated(subnetId);
          setOpen(false);
        }}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveSubnetDialog />,
};
