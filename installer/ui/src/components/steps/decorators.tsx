import { Decorator } from "@storybook/react";
import { WizardProvider } from "../../contexts/WizardContext";

/**
 * Wraps stories in a WizardProvider so step components can use useWizard()
 */
export const withWizardProvider: Decorator = (Story) => (
  <WizardProvider>
    <div className="dark min-h-screen bg-zinc-950 text-white p-6">
      <Story />
    </div>
  </WizardProvider>
);

