import type { Meta, StoryObj } from "@storybook/react";
import { OnPremiseClusterProgress } from "./OnPremiseClusterProgress";
import { withWizardProvider } from "../decorators";

const meta: Meta<typeof OnPremiseClusterProgress> = {
  title: "Steps/Step3/OnPremiseClusterProgress",
  component: OnPremiseClusterProgress,
  tags: ["autodocs"],
  decorators: [withWizardProvider],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof OnPremiseClusterProgress>;

export const Default: Story = {};
