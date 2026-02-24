import { useState } from "react";
import { LayoutDashboard, Monitor, Database, BarChart3 } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { useWizard } from "../../../contexts/WizardContext";
import { cn } from "../../ui/utils";

export function ComponentSelection() {
  const { state, setSelectedComponents, nextStep, previousStep } = useWizard();
  const [dashboardSelected, setDashboardSelected] = useState(
    state.selectedComponents["dashboard"] ?? false
  );

  const handleToggle = () => {
    setDashboardSelected((prev) => !prev);
  };

  const handleContinue = () => {
    setSelectedComponents({ dashboard: dashboardSelected });
    nextStep();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Additional Components</h2>
        <p className="mt-2 text-zinc-400">
          Select optional components to deploy on your cluster
        </p>
      </div>

      <Card
        className={cn(
          "cursor-pointer border-2 transition-all hover:border-blue-500/50",
          dashboardSelected
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-800 bg-zinc-900"
        )}
        onClick={handleToggle}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-xl transition-colors",
                dashboardSelected ? "bg-blue-500/20" : "bg-zinc-800"
              )}
            >
              <LayoutDashboard
                className={cn(
                  "size-7",
                  dashboardSelected ? "text-blue-400" : "text-zinc-500"
                )}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Management Dashboard
                  </h3>
                  <span
                    className={cn(
                      "mt-0.5 inline-block rounded px-2 py-0.5 text-xs font-medium",
                      dashboardSelected
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    Optional
                  </span>
                </div>

                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md border-2 transition-all",
                    dashboardSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-zinc-600 bg-transparent"
                  )}
                >
                  {dashboardSelected && (
                    <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-400">
                Web-based dashboard for monitoring and managing your Ascendra cluster,
                including data collection, metrics visualization, and real-time cluster insights.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                  <Monitor className="size-4 text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-zinc-300">UI</p>
                    <p className="text-[10px] text-zinc-500">Cluster overview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                  <Database className="size-4 text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-zinc-300">InfluxDB</p>
                    <p className="text-[10px] text-zinc-500">Metrics storage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                  <BarChart3 className="size-4 text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-zinc-300">Collector</p>
                    <p className="text-[10px] text-zinc-500">Data pipeline</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-xs text-zinc-500">
                <span>CPU: 500m</span>
                <span>Memory: 512Mi</span>
                <span>Storage: 5Gi</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!dashboardSelected && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-sm text-zinc-500">
            You can skip this step and deploy the dashboard later.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          className="min-w-32"
        >
          {dashboardSelected ? "Install Dashboard" : "Skip & Continue"}
        </Button>
      </div>
    </div>
  );
}
