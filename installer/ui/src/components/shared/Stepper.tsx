import { Check } from "lucide-react";
import { cn } from "../ui/utils";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepperProps {
  currentStep: number;
  steps: Step[];
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full py-8">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="flex flex-1 items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted &&
                      "border-blue-500 bg-blue-500 text-white",
                    isCurrent &&
                      "border-blue-500 bg-blue-500/10 text-blue-500 ring-4 ring-blue-500/20",
                    isUpcoming &&
                      "border-zinc-700 bg-zinc-900 text-zinc-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-6" />
                  ) : (
                    <span className="text-lg font-semibold">{step.number}</span>
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) && "text-white",
                      isUpcoming && "text-zinc-500"
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      (isCompleted || isCurrent) && "text-zinc-400",
                      isUpcoming && "text-zinc-600"
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 transition-all",
                    isCompleted ? "bg-blue-500" : "bg-zinc-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
