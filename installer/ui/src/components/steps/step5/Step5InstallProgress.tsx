import { useEffect, useState } from "react";
import {
  CheckCircle,
  Loader2,
  Package,
  Download,
  ExternalLink,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Separator } from "../../ui/separator";
import { useWizard } from "../../../contexts/WizardContext";
import { AVAILABLE_COMPONENTS } from "../../../services/installer.service";
import { cn } from "../../ui/utils";

export function InstallProgress() {
  const { state, startInstallation, resetWizard } = useWizard();
  const [hasStarted, setHasStarted] = useState(false);
  const [accessUrls, setAccessUrls] = useState<Record<string, string>>({});
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const components = AVAILABLE_COMPONENTS.filter(
    (c) => state.selectedComponents[c.id]
  );

  const noComponentsSelected = components.length === 0;
  const dashboardSelected = state.selectedComponents["dashboard"] === true;

  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      startInstallation();
    }
  }, [hasStarted, startInstallation]);

  const dashboardProgress = state.installationProgress.find(
    (p) => p.componentId === "dashboard"
  );
  const installationDone = dashboardSelected
    ? dashboardProgress?.status === "completed"
    : state.isComplete;

  const realDashboardUrl = state.dashboardUrl || null;

  useEffect(() => {
    if (installationDone) {
      if (realDashboardUrl) {
        setAccessUrls({ dashboard: realDashboardUrl });
      }
      if (dashboardSelected && realDashboardUrl) {
        setRedirectCountdown(5);
      }
    }
  }, [installationDone, dashboardSelected, realDashboardUrl]);

  // Countdown timer
  useEffect(() => {
    if (redirectCountdown === null || redirectCountdown <= 0) return;

    const timer = setTimeout(() => {
      setRedirectCountdown(redirectCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown]);

  // Handle redirect with fade out
  useEffect(() => {
    if (redirectCountdown === 0 && realDashboardUrl) {
      window.dispatchEvent(new Event('installer-fade-out'));

      setTimeout(() => {
        window.location.href = realDashboardUrl;
      }, 800);
    }
  }, [redirectCountdown, realDashboardUrl]);

  const totalProgress =
    state.installationProgress.length > 0
      ? state.installationProgress.reduce((sum, p) => sum + p.progress, 0) /
        state.installationProgress.length
      : 0;

  const handleDownloadKubeconfig = () => {
    // Mock download
    const config = `apiVersion: v1
clusters:
- cluster:
    server: https://api.${state.clusterConfig.name}.ascendra.io
  name: ${state.clusterConfig.name}
contexts:
- context:
    cluster: ${state.clusterConfig.name}
    user: admin
  name: ${state.clusterConfig.name}
current-context: ${state.clusterConfig.name}
kind: Config
users:
- name: admin
  user:
    token: mock-token-${Date.now()}`;

    const blob = new Blob([config], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.clusterConfig.name}-kubeconfig.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRedirectNow = () => {
    if (realDashboardUrl) {
      window.dispatchEvent(new Event('installer-fade-out'));
      setTimeout(() => {
        window.location.href = realDashboardUrl;
      }, 800);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          {installationDone ? "Installation Complete!" : "Installing Components"}
        </h2>
        <p className="mt-2 text-zinc-400">
          {installationDone
            ? "Your Ascendra system is ready to use"
            : "Please wait while we deploy the selected components"}
        </p>
      </div>

      {/* Overall Progress */}
      {!installationDone && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  Overall Progress
                </span>
                <span className="text-sm font-medium text-blue-400">
                  {Math.round(totalProgress)}%
                </span>
              </div>
              <Progress value={totalProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Installation Status */}
      {noComponentsSelected ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6 text-center">
            <Package className="mx-auto size-12 text-zinc-600 mb-3" />
            <p className="text-zinc-400">No additional components were selected for installation.</p>
            <p className="mt-1 text-sm text-zinc-500">Your cluster is ready to use.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Component Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {components.map((component) => {
              const progress = state.installationProgress.find(
                (p) => p.componentId === component.id
              );
              const status = progress?.status || "pending";
              const progressValue = progress?.progress || 0;

              return (
                <div
                  key={component.id}
                  className={cn(
                    "rounded-lg p-4 transition-all",
                    status === "installing" && "bg-blue-500/10",
                    status === "completed" && "bg-green-500/10",
                    status === "failed" && "bg-red-500/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        status === "completed" && "bg-green-500/20",
                        status === "installing" && "bg-blue-500/20",
                        status === "failed" && "bg-red-500/20",
                        status === "pending" && "bg-zinc-800"
                      )}
                    >
                      {status === "completed" ? (
                        <CheckCircle className="size-5 text-green-400" />
                      ) : status === "installing" ? (
                        <Loader2 className="size-5 animate-spin text-blue-400" />
                      ) : status === "failed" ? (
                        <XCircle className="size-5 text-red-400" />
                      ) : (
                        <Package className="size-5 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">
                          {component.name}
                        </h4>
                        <span className={cn(
                          "text-sm",
                          status === "failed" ? "text-red-400" : "text-zinc-400"
                        )}>
                          {status === "failed" ? "Failed" : `${progressValue}%`}
                        </span>
                      </div>
                      <p className={cn(
                        "mt-1 text-xs",
                        status === "failed" ? "text-red-400" : "text-zinc-500"
                      )}>
                        {progress?.message || "Waiting..."}
                      </p>
                      {status === "installing" && (
                        <Progress value={progressValue} className="mt-2 h-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Success Card */}
      {installationDone && (
        <>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-green-500/20">
                  <CheckCircle className="size-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    Installation Successful!
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    All components have been successfully deployed to your
                    cluster. You can now access your Ascendra system.
                  </p>
                  {redirectCountdown !== null && redirectCountdown > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2">
                      <Loader2 className="size-4 animate-spin text-blue-400" />
                      <p className="text-sm text-blue-300">
                        Redirecting to dashboard in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Information */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Access Your System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(accessUrls).map(([key, url]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg bg-zinc-800 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white capitalize">
                        {key}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">{url}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">
                  Kubernetes Configuration
                </h4>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadKubeconfig}
                >
                  <Download className="size-4" />
                  Download kubeconfig
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="font-medium text-blue-400">1.</span>
                  Download your kubeconfig file to access the cluster with
                  kubectl
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-blue-400">2.</span>
                  Access the dashboard to monitor your cluster
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-blue-400">3.</span>
                  Review the monitoring stack for system metrics
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-blue-400">4.</span>
                  Deploy your first application to the cluster
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetWizard}>
              <RotateCcw className="size-4" />
              Start New Installation
            </Button>
            <Button 
              size="lg" 
              onClick={handleRedirectNow}
              className="min-w-40"
            >
              <ExternalLink className="size-4" />
              Go to Dashboard Now
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

