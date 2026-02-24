import type { Meta, StoryObj } from "@storybook/react";
import { CloudClusterProgress } from "./CloudClusterProgress";
import { withWizardProvider } from "../decorators";

const meta: Meta<typeof CloudClusterProgress> = {
  title: "Steps/Step3/CloudClusterProgress",
  component: CloudClusterProgress,
  tags: ["autodocs"],
  decorators: [withWizardProvider],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CloudClusterProgress>;

export const Default: Story = {};
