import type { Meta, StoryObj } from "@storybook/react";
import { InstallProgress } from "./InstallProgress";
import { withWizardProvider } from "../decorators";

const meta: Meta<typeof InstallProgress> = {
  title: "Steps/Step5/InstallProgress",
  component: InstallProgress,
  tags: ["autodocs"],
  decorators: [withWizardProvider],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof InstallProgress>;

export const Default: Story = {};
