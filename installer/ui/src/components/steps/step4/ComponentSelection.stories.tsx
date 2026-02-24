import type { Meta, StoryObj } from "@storybook/react";
import { ComponentSelection } from "./ComponentSelection";
import { withWizardProvider } from "../decorators";

const meta: Meta<typeof ComponentSelection> = {
  title: "Steps/Step4/ComponentSelection",
  component: ComponentSelection,
  tags: ["autodocs"],
  decorators: [withWizardProvider],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ComponentSelection>;

export const Default: Story = {};
