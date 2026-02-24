import type { Meta, StoryObj } from "@storybook/react";
import { LoadingIndicator } from "./LoadingIndicator";

const meta: Meta<typeof LoadingIndicator> = {
  title: "Shared/LoadingIndicator",
  component: LoadingIndicator,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoadingIndicator>;

export const Default: Story = {
  args: {},
};

export const WithText: Story = {
  args: {
    text: "Loading regions...",
  },
};

export const Small: Story = {
  args: {
    text: "Loading...",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    text: "Loading VPCs...",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    text: "Loading subnets...",
    size: "lg",
  },
};

export const NoText: Story = {
  args: {
    size: "md",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-16 text-sm text-zinc-400">Small:</span>
        <LoadingIndicator text="Loading..." size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-16 text-sm text-zinc-400">Medium:</span>
        <LoadingIndicator text="Loading..." size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-16 text-sm text-zinc-400">Large:</span>
        <LoadingIndicator text="Loading..." size="lg" />
      </div>
    </div>
  ),
};

