import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { StepTransition } from "./StepTransition";
import { Button } from "../ui/button";

const meta: Meta<typeof StepTransition> = {
  title: "Layout/StepTransition",
  component: StepTransition,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StepTransition>;

export const Default: Story = {
  args: {
    stepKey: 1,
    children: (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h2 className="text-2xl font-bold text-white">Step 1 Content</h2>
        <p className="mt-2 text-zinc-400">
          This is the content for step 1
        </p>
      </div>
    ),
  },
};

function InteractiveTransition() {
  const [step, setStep] = useState(1);

  const steps = [
    { title: "Choose Provider", description: "Select your cloud platform" },
    { title: "Configure Cluster", description: "Set up networking and nodes" },
    { title: "Install Components", description: "Deploy system services" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <Button
            key={i}
            variant={step === i + 1 ? "default" : "outline"}
            onClick={() => setStep(i + 1)}
          >
            Step {i + 1}
          </Button>
        ))}
      </div>

      <StepTransition stepKey={step}>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            {steps[step - 1].title}
          </h2>
          <p className="mt-2 text-zinc-400">
            {steps[step - 1].description}
          </p>
        </div>
      </StepTransition>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveTransition />,
};
