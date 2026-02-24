import type { Meta, StoryObj } from "@storybook/react";
import { CloudProviderSelection } from "./CloudProviderSelection";
import { withWizardProvider } from "../decorators";

const meta: Meta<typeof CloudProviderSelection> = {
  title: "Steps/Step1/CloudProviderSelection",
  component: CloudProviderSelection,
  tags: ["autodocs"],
  decorators: [withWizardProvider],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CloudProviderSelection>;

export const Default: Story = {};
