import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-lg p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-400">Card content goes here.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Cluster Settings</CardTitle>
        <CardDescription>Configure your cluster</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-400">Your cluster configuration details.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const SuccessCard: Story = {
  render: () => (
    <Card className="border-green-500/20 bg-green-500/5">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white">Installation Successful!</h3>
        <p className="mt-1 text-sm text-zinc-400">
          All components have been deployed successfully.
        </p>
      </CardContent>
    </Card>
  ),
};

export const InfoCard: Story = {
  render: () => (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white">Ready to Install</h3>
        <p className="mt-1 text-sm text-zinc-400">
          3 components selected for installation.
        </p>
      </CardContent>
    </Card>
  ),
};

export const SummaryCard: Story = {
  render: () => (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="text-white">Configuration Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-zinc-500">Total Node Pools</p>
            <p className="mt-1 font-medium text-white">2</p>
          </div>
          <div>
            <p className="text-zinc-500">Total Nodes</p>
            <p className="mt-1 font-medium text-white">6</p>
          </div>
          <div>
            <p className="text-zinc-500">Region</p>
            <p className="mt-1 font-medium text-white">us-east-1</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

