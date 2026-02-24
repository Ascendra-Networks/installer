import type { Meta, StoryObj } from "@storybook/react";
import { DialogActions } from "./DialogActions";
import { Sparkles, Trash2, Save, Send } from "lucide-react";

const meta: Meta<typeof DialogActions> = {
  title: "Shared/DialogActions",
  component: DialogActions,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DialogActions>;

export const Default: Story = {
  args: {
    onCancel: () => console.log("Cancel clicked"),
    onConfirm: () => console.log("Confirm clicked"),
    confirmText: "Confirm",
  },
};

export const WithIcon: Story = {
  args: {
    onCancel: () => {},
    onConfirm: () => {},
    confirmText: "Create VPC",
    confirmIcon: Sparkles,
  },
};

export const Loading: Story = {
  args: {
    onCancel: () => {},
    onConfirm: () => {},
    confirmText: "Create VPC",
    confirmIcon: Sparkles,
    isLoading: true,
    loadingText: "Creating...",
  },
};

export const Disabled: Story = {
  args: {
    onCancel: () => {},
    onConfirm: () => {},
    confirmText: "Save Changes",
    confirmIcon: Save,
    disabled: true,
  },
};

export const Destructive: Story = {
  args: {
    onCancel: () => {},
    onConfirm: () => {},
    confirmText: "Delete Cluster",
    confirmIcon: Trash2,
    confirmVariant: "destructive",
  },
};

export const CustomCancelText: Story = {
  args: {
    onCancel: () => {},
    onConfirm: () => {},
    cancelText: "Discard",
    confirmText: "Submit",
    confirmIcon: Send,
  },
};

