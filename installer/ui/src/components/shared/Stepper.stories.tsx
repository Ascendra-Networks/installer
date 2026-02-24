import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./Stepper";

const meta: Meta<typeof Stepper> = {
  title: "Layout/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-4xl p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const cloudSteps = [
  { number: 1, title: "Cloud Provider", description: "Choose platform" },
  { number: 2, title: "Configure", description: "Cluster settings" },
  { number: 3, title: "Create", description: "Provision cluster" },
  { number: 4, title: "Components", description: "Select features" },
  { number: 5, title: "Install", description: "Deploy system" },
];

const onPremiseSteps = [
  { number: 1, title: "Cloud Provider", description: "Choose platform" },
  { number: 2, title: "Configure Nodes", description: "Node setup" },
  { number: 3, title: "Components", description: "Select features" },
  { number: 4, title: "Install", description: "Deploy system" },
];

export const Step1: Story = {
  args: {
    currentStep: 1,
    steps: cloudSteps,
  },
};

export const Step2: Story = {
  args: {
    currentStep: 2,
    steps: cloudSteps,
  },
};

export const Step3: Story = {
  args: {
    currentStep: 3,
    steps: cloudSteps,
  },
};

export const Step4: Story = {
  args: {
    currentStep: 4,
    steps: cloudSteps,
  },
};

export const Step5Complete: Story = {
  args: {
    currentStep: 5,
    steps: cloudSteps,
  },
};

export const OnPremiseFlow: Story = {
  args: {
    currentStep: 2,
    steps: onPremiseSteps,
  },
};

export const AllComplete: Story = {
  args: {
    currentStep: 6,
    steps: cloudSteps,
  },
};
