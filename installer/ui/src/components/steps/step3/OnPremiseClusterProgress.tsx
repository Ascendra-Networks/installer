import { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  Loader2,
  Server,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { useWizard } from "../../../contexts/WizardContext";
import { cn } from "../../ui/utils";
import type { DeploymentSubStep, DeploymentSubStepId } from "../../../types";
import { InfrastructureVisual, deriveVisualStage } from "./InfrastructureVisual";

const SUB_STEP_LABELS: Record<DeploymentSubStepId, string> = {
  infrastructure: "Create Infrastructure",
  cluster: "Create Cluster",
  configuration: "Infrastructure Configuration",
};

const CLUSTER_PHASE_MESSAGES: Record<string, string> = {
  prerequisites: "Initializing nodes...",
  master: "Creating master...",
  workers: "Connecting workers...",
  status: "Verifying cluster...",
};

const CONFIG_PHASE_MESSAGES: Record<string, string> = {
  helm: "Installing package manager...",
  configure: "Configuring platform services...",
  secret: "Setting up registry access...",
  deploy: "Creating network",
  inframanager: "Creating network",
  "kubevirt-waiting": "Creating virtual compute",
  "network-waiting": "Waiting for network layer...",
  verification: "Verifying all components...",
  summary: "All components are up and running",
};

function getSubStepPhaseMessage(
  subStep: DeploymentSubStep,
  step: string,
  playbook: string,
  globalMessage: string
): string {
  if (subStep.status !== "running" && subStep.status !== "retrying") {
    return subStep.message;
  }

  if (subStep.id === "cluster") {
    if (playbook === "k8s-cluster-deploy") {
      return CLUSTER_PHASE_MESSAGES[step] || "Deploying cluster...";
    }
    return "Deploying cluster...";
  }

  if (subStep.id === "configuration") {
    if (playbook === "tyr-deploy") {
      return CONFIG_PHASE_MESSAGES[step] || "Configuring infrastructure...";
    }
    return "Configuring infrastructure...";
  }

  return globalMessage || "";
}

function getSubStepTaskDetail(
  subStep: DeploymentSubStep,
  step: string,
  playbook: string,
  globalMessage: string
): string | null {
  if (subStep.status !== "running" && subStep.status !== "retrying") {
    return null;
  }

  if (subStep.id === "cluster" && playbook === "k8s-cluster-deploy") {
    const phaseMsg = CLUSTER_PHASE_MESSAGES[step];
    if (globalMessage && phaseMsg && globalMessage !== phaseMsg) {
      return globalMessage;
    }
    return null;
  }

  if (subStep.id === "configuration" && playbook === "tyr-deploy") {
    const phaseMsg = CONFIG_PHASE_MESSAGES[step];
    if (globalMessage && phaseMsg && globalMessage !== phaseMsg) {
      return globalMessage;
    }
    return null;
  }

  return null;
}

function computeOverallProgress(subSteps: DeploymentSubStep[], rawProgress: number): number {
  if (subSteps.length === 0) return rawProgress;

  const weights: Record<DeploymentSubStepId, { start: number; end: number }> = {
    infrastructure: { start: 0, end: 0 },
    cluster: { start: 0, end: 55 },
    configuration: { start: 55, end: 100 },
  };

  let overall = 0;
  for (const s of subSteps) {
    const w = weights[s.id];
    if (s.status === "completed") {
      overall = w.end;
    } else if (s.status === "running" || s.status === "retrying") {
      overall = w.start + Math.floor(((rawProgress || 0) / 100) * (w.end - w.start));
      break;
    } else {
      break;
    }
  }

  return Math.min(overall, 100);
}

export function OnPremiseClusterProgress() {
  const { state, nextStep, startClusterCreation, retrySubStep } = useWizard();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted && state.clusterCreationStatus === "pending") {
      setHasStarted(true);
      startClusterCreation();
    }
  }, [hasStarted, state.clusterCreationStatus, startClusterCreation]);

  const isComplete = state.clusterCreationStatus === "completed";

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => nextStep(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, nextStep]);

  const overallProgress = isComplete
    ? 100
    : computeOverallProgress(
        state.deploymentSubSteps,
        state.clusterCreationProgress
      );

  const workerCount = state.onPremiseConfig?.workerNodes.reduce(
    (sum, group) => sum + group.nodes.length,
    0
  ) || 2;

  const masterCount = state.onPremiseConfig?.controlPlane.nodes.length || 1;

  const visualStage = deriveVisualStage(
    state.deploymentSubSteps,
    state.clusterCreationStep,
    state.clusterCreationProgress,
    true
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          {isComplete ? "Cluster Created!" : "Creating Your Cluster"}
        </h2>
        <p className="mt-2 text-zinc-400">
          {isComplete
            ? "Your on-premise cluster is ready"
            : "Please wait while we set up your on-premise cluster"}
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Overall Progress
                  </span>
                  <span className="text-sm font-medium text-blue-400">
                    {overallProgress}%
                  </span>
                </div>
                <Progress value={overallProgress} />
              </div>

              <div className="space-y-2">
                {state.deploymentSubSteps.map((subStep) => (
                  <SubStepRow
                    key={subStep.id}
                    subStep={subStep}
                    step={state.clusterCreationStep}
                    playbook={state.clusterCreationPlaybook}
                    globalMessage={state.clusterCreationMessage}
                    onRetry={() => retrySubStep(subStep.id)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <InfrastructureVisual
          stage={visualStage}
          masterCount={masterCount}
          workerCount={workerCount}
          isOnPremise
          isActive={state.clusterCreationStatus === "installing"}
        />
      </div>

      {isComplete && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-green-500/20">
                <CheckCircle className="size-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Cluster &ldquo;{state.clusterConfig.name}&rdquo; is ready!
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Your on-premise cluster has been successfully configured.
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Proceeding to component selection...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SubStepRow({
  subStep,
  step,
  playbook,
  globalMessage,
  onRetry,
}: {
  subStep: DeploymentSubStep;
  step: string;
  playbook: string;
  globalMessage: string;
  onRetry: () => void;
}) {
  const isCompleted = subStep.status === "completed";
  const isRunning = subStep.status === "running";
  const isFailed = subStep.status === "failed";
  const isRetrying = subStep.status === "retrying";
  const isPending = subStep.status === "pending";
  const isActive = isRunning || isRetrying;

  const phaseMessage = getSubStepPhaseMessage(subStep, step, playbook, globalMessage);
  const taskDetail = getSubStepTaskDetail(subStep, step, playbook, globalMessage);

  const recentRef = useRef<string[]>([]);
  const [recentMessages, setRecentMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive || !taskDetail) return;
    const list = recentRef.current;
    if (list[list.length - 1] !== taskDetail) {
      list.push(taskDetail);
      if (list.length > 3) list.shift();
      setRecentMessages([...list]);
    }
  }, [taskDetail, isActive]);

  useEffect(() => {
    if (!isActive) {
      recentRef.current = [];
      setRecentMessages([]);
    }
  }, [isActive]);

  return (
    <div
      className={cn(
        "rounded-lg p-3 transition-all",
        isRunning && "bg-blue-500/10",
        isRetrying && "bg-yellow-500/10",
        isFailed && "bg-red-500/10",
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            isCompleted && "bg-green-500/20 text-green-400",
            isRunning && "bg-blue-500/20 text-blue-400",
            isRetrying && "bg-yellow-500/20 text-yellow-400",
            isFailed && "bg-red-500/20 text-red-400",
            isPending && "bg-zinc-800 text-zinc-500"
          )}
        >
          {isCompleted && <CheckCircle className="size-5" />}
          {isRunning && <Loader2 className="size-5 animate-spin" />}
          {isRetrying && <RefreshCw className="size-5 animate-spin" />}
          {isFailed && <XCircle className="size-5" />}
          {isPending && <Server className="size-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                (isCompleted || isRunning) && "text-white",
                isRetrying && "text-yellow-300",
                isFailed && "text-red-300",
                isPending && "text-zinc-500"
              )}
            >
              {SUB_STEP_LABELS[subStep.id]}
            </span>

            {isCompleted && (
              <span className="text-xs font-medium text-green-400">Done</span>
            )}

            {isRetrying && subStep.attempt > 0 && (
              <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs font-medium text-yellow-400">
                Retry {subStep.attempt}/{subStep.maxAttempts}
              </span>
            )}
          </div>

          {isActive && phaseMessage && (
            <p className="mt-1 truncate text-xs text-zinc-400">{phaseMessage}</p>
          )}

          {isActive && recentMessages.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {recentMessages.map((msg, i) => {
                const isCurrent = i === recentMessages.length - 1;
                return (
                  <p
                    key={`${msg}-${i}`}
                    className={cn(
                      "truncate text-xs transition-opacity duration-300",
                      isCurrent ? "text-blue-300/80" : "text-zinc-600"
                    )}
                  >
                    <span className={isCurrent ? "text-blue-400/60" : "text-zinc-700"}>›</span>{" "}
                    {msg}
                  </p>
                );
              })}
            </div>
          )}

          {isFailed && (
            <div className="mt-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{subStep.error || subStep.message}</p>
            </div>
          )}
        </div>

        {isFailed && (
          <button
            onClick={onRetry}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/30"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
