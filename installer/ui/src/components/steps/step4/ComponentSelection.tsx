import { useState, useEffect } from "react";
import { Package, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { Separator } from "../../ui/separator";
import { useWizard } from "../../../contexts/WizardContext";
import { AVAILABLE_COMPONENTS } from "../../../services/components";
import { Component, ComponentSelection as ComponentSelectionState } from "../../../types";
import { cn } from "../../ui/utils";

export function ComponentSelection() {
  const { state, setSelectedComponents, nextStep, previousStep } = useWizard();
  const [components] = useState<Component[]>(AVAILABLE_COMPONENTS);
  const [selections, setSelections] = useState<ComponentSelectionState>(
    state.selectedComponents
  );

  // Auto-select required components and handle dependencies
  useEffect(() => {
    const newSelections = { ...selections };
    
    // Auto-select required components
    components.forEach((component) => {
      if (component.required) {
        newSelections[component.id] = true;
      }
    });

    // Handle dependencies
    Object.keys(newSelections).forEach((componentId) => {
      if (newSelections[componentId]) {
        const component = components.find((c) => c.id === componentId);
        if (component) {
          component.dependencies.forEach((depId) => {
            newSelections[depId] = true;
          });
        }
      }
    });

    setSelections(newSelections);
  }, [components]);

  const handleToggle = (componentId: string, checked: boolean) => {
    const component = components.find((c) => c.id === componentId);
    if (component?.required) return;

    const newSelections = { ...selections, [componentId]: checked };

    // If unchecking, also uncheck components that depend on this
    if (!checked) {
      components.forEach((c) => {
        if (c.dependencies.includes(componentId)) {
          newSelections[c.id] = false;
        }
      });
    }

    // If checking, also check dependencies
    if (checked && component) {
      component.dependencies.forEach((depId) => {
        newSelections[depId] = true;
      });
    }

    setSelections(newSelections);
  };

  const handleContinue = () => {
    setSelectedComponents(selections);
    nextStep();
  };

  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Select Components</h2>
        <p className="mt-2 text-zinc-400">
          Choose which Ascendra components to install on your cluster
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Components List */}
        <div className="space-y-4 lg:col-span-2">
          {components.map((component) => {
            const isSelected = selections[component.id] || false;
            const isRequired = component.required;
            const hasDependencies = component.dependencies.length > 0;

            return (
              <Card
                key={component.id}
                className={cn(
                  "border-2 transition-all",
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={component.id}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleToggle(component.id, checked as boolean)
                      }
                      disabled={isRequired}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={component.id}
                          className="text-base font-semibold text-white"
                        >
                          {component.name}
                        </Label>
                        {isRequired && (
                          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
                        {component.description}
                      </p>

                      {hasDependencies && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                          <AlertCircle className="size-3" />
                          <span>
                            Requires:{" "}
                            {component.dependencies
                              .map(
                                (depId) =>
                                  components.find((c) => c.id === depId)?.name
                              )
                              .join(", ")}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                        <span>CPU: {component.resourceRequirements.cpu}</span>
                        <span>
                          Memory: {component.resourceRequirements.memory}
                        </span>
                        <span>
                          Storage: {component.resourceRequirements.storage}
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        isSelected ? "bg-blue-500/20" : "bg-zinc-800"
                      )}
                    >
                      <Package
                        className={cn(
                          "size-5",
                          isSelected ? "text-blue-400" : "text-zinc-500"
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Selected Components</span>
                <span className="text-lg font-semibold text-white">
                  {selectedCount}
                </span>
              </div>

              <Separator />

              <div className="space-y-3">
                {components
                  .filter((c) => selections[c.id])
                  .map((component) => (
                    <div
                      key={component.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="size-4 text-blue-400" />
                      <span className="text-white">{component.name}</span>
                    </div>
                  ))}
              </div>

              {selectedCount > 0 && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="size-4 text-blue-400 mt-0.5" />
                      <p className="text-xs text-blue-300">
                        Ready to install {selectedCount} component{selectedCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={selectedCount === 0}
          className="min-w-32"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

