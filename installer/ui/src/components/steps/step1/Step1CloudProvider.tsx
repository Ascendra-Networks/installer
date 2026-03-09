import { Cloud, Server, Boxes } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { useWizard } from "../../../contexts/WizardContext";
import { CloudProvider } from "../../../types";
import { cn } from "../../ui/utils";

const PROVIDER_ICONS = {
  aws: Cloud,
  azure: Boxes,
  gcp: Cloud,
  "on-premise": Server,
  "onpremise": Server,
};

const PROVIDERS = [
  {
    id: "aws" as CloudProvider,
    name: "Amazon Web Services",
    description: "Deploy on AWS cloud infrastructure",
    color: "orange",
    available: true,
  },
  {
    id: "azure" as CloudProvider,
    name: "Microsoft Azure",
    description: "Deploy on Azure cloud platform",
    color: "blue",
    available: false,
  },
  {
    id: "gcp" as CloudProvider,
    name: "Google Cloud Platform",
    description: "Deploy on Google Cloud infrastructure",
    color: "red",
    available: false,
  },
  {
    id: "on-premise" as CloudProvider,
    name: "On-Premise",
    description: "Deploy on your existing physical infrastructure",
    color: "purple",
    available: true,
  },
];

export function CloudProviderSelection() {
  const { state, setCloudProvider, nextStep } = useWizard();

  const handleProviderSelect = (provider: CloudProvider, available: boolean) => {
    if (!available) return;
    setCloudProvider(provider);
  };

  const handleContinue = () => {
    if (state.cloudProvider) {
      nextStep();
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Choose Your Cloud Provider</h2>
        <p className="mt-2 text-zinc-400">
          Select where you want to deploy your Ascendra cluster
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const Icon = PROVIDER_ICONS[provider.id];
          const isSelected = state.cloudProvider === provider.id;
          const isAvailable = provider.available;

          return (
            <Card
              key={provider.id}
              className={cn(
                "border-2 transition-all",
                isAvailable 
                  ? "cursor-pointer hover:border-blue-500/50" 
                  : "cursor-not-allowed opacity-60",
                isSelected
                  ? "border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/20"
                  : "border-zinc-800 bg-zinc-900",
                isAvailable && !isSelected && "hover:bg-zinc-800"
              )}
              onClick={() => handleProviderSelect(provider.id, isAvailable)}
            >
              <CardContent className="flex items-start gap-4 p-6">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-lg",
                    isSelected ? "bg-blue-500/20" : "bg-zinc-800"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6",
                      isSelected ? "text-blue-400" : "text-zinc-400"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {provider.name}
                    </h3>
                    {!isAvailable && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {provider.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-blue-500">
                    <svg
                      className="size-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!state.cloudProvider}
          className="min-w-32"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

