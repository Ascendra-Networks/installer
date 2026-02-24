import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription } from "./alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
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
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>Configuration is valid!</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        Validation failed: Cluster name must be lowercase letters, numbers, and hyphens only.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Some nodes are not reachable. Please check your SSH configuration.
      </AlertDescription>
    </Alert>
  ),
};

export const SSHResults: Story = {
  render: () => (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>SSH Test Results:</strong> 2/3 nodes accessible
        <div className="mt-2">
          <strong>Failed nodes:</strong>
          <ul className="list-disc list-inside">
            <li>10.0.1.12 - Connection timed out</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  ),
};

