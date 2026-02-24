import type { Meta, StoryObj } from "@storybook/react";
import { ModernLoader } from "./ModernLoader";

const meta: Meta<typeof ModernLoader> = {
  title: "Layout/ModernLoader",
  component: ModernLoader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ModernLoader>;

export const Default: Story = {
  args: {},
};

export const CustomMessage: Story = {
  args: {
    message: "Initializing Ascendra...",
  },
};

export const LongMessage: Story = {
  args: {
    message: "Connecting to your cluster and preparing deployment...",
  },
};
