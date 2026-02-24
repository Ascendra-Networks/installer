import { WizardProvider, useWizard } from "./contexts/WizardContext";
import { Stepper } from "./components/shared/Stepper";
import { StepTransition } from "./components/shared/StepTransition";
import { CloudProviderSelection } from "./components/steps/step1/CloudProviderSelection";
import { AWSCloudConfiguration } from "./components/steps/step2/AWSCloudConfiguration/AWSCloudConfiguration";
import { OnPremiseConfiguration } from "./components/steps/step2/OnPremiseConfiguration/OnPremiseConfiguration";
import { CloudClusterProgress } from "./components/steps/step3/CloudClusterProgress";
import { OnPremiseClusterProgress } from "./components/steps/step3/OnPremiseClusterProgress";
import { ComponentSelection } from "./components/steps/step4/Step4ComponentSelection";
import { InstallProgress } from "./components/steps/step5/Step5InstallProgress";
import { Server } from "lucide-react";
import { useState, useEffect } from "react";

const WIZARD_STEPS = [
  { number: 1, title: "Cloud Provider", description: "Choose platform" },
  { number: 2, title: "Configure", description: "Cluster settings" },
  { number: 3, title: "Create", description: "Create cluster" },
  { number: 4, title: "Components", description: "Select features" },
  { number: 5, title: "Install", description: "Deploy system" },
];

function WizardContent() {
  const { state, isRestoring, setOnPremiseConfig } = useWizard();
  const [isFadingOut, setIsFadingOut] = useState(false);

  const isOnPremise = state.cloudProvider === 'on-premise' || state.cloudProvider === 'onpremise';
  
  const wizardSteps = WIZARD_STEPS;

  // Listen for Step5 fade out trigger
  useEffect(() => {
    // Custom event listener for fade-out trigger from Step5
    const handleFadeOut = () => {
      setIsFadingOut(true);
    };
    
    window.addEventListener('installer-fade-out', handleFadeOut);
    return () => window.removeEventListener('installer-fade-out', handleFadeOut);
  }, []);

  const renderStep = () => {
    if (isOnPremise) {
      // On-premise flow
      switch (state.currentStep) {
        case 1:
          return <CloudProviderSelection />;
        case 2:
          return (
            <OnPremiseConfiguration
              onConfigChange={setOnPremiseConfig}
              initialConfig={state.onPremiseConfig}
            />
          );
        case 3:
          return <OnPremiseClusterProgress />;
        case 4:
          return <ComponentSelection />;
        case 5:
          return <InstallProgress />;
        default:
          return <CloudProviderSelection />;
      }
    } else {
      // Cloud provider flow
      switch (state.currentStep) {
        case 1:
          return <CloudProviderSelection />;
        case 2:
          return <AWSCloudConfiguration />;
        case 3:
          return <CloudClusterProgress />;
        case 4:
          return <ComponentSelection />;
        case 5:
          return <InstallProgress />;
        default:
          return <CloudProviderSelection />;
      }
    }
  };

  if (isRestoring) {
    return (
      <div className="dark flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`dark flex h-screen flex-col bg-zinc-950 text-white transition-opacity duration-[800ms] ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Server className="size-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                Ascendra Installer
              </h1>
              <p className="text-xs text-zinc-400">
                Cluster Management System Setup
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Stepper */}
          <Stepper currentStep={state.currentStep} steps={wizardSteps} />

          {/* Step Content with Transition */}
          <div className="mt-8">
            <StepTransition stepKey={state.currentStep}>
              {renderStep()}
            </StepTransition>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-zinc-800 bg-zinc-900 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-zinc-500">
          <p>© 2026 Ascendra Networks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}

