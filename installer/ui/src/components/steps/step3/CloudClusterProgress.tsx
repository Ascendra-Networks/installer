import { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  Loader2,
  Server,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Circle,
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

/* ── Terraform lifecycle phases ── */
const INFRA_PHASES = [
  { id: "init", label: "Initialize", steps: ["starting", "init"] },
  { id: "plan", label: "Plan", steps: ["plan"] },
  { id: "apply", label: "Apply", steps: ["apply"] },
  { id: "finalize", label: "Finalize", steps: ["outputs", "complete", "generating-inventory", "checking-ssh", "ssh-ready"] },
] as const;

function getInfraPhaseIndex(step: string): number {
  return INFRA_PHASES.findIndex((p) => (p.steps as readonly string[]).includes(step));
}

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
  _globalMessage: string
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

  return _globalMessage || "";
}

function getSubStepTaskDetail(
  subStep: DeploymentSubStep,
  step: string,
  _playbook: string,
  globalMessage: string
): string | null {
  if (subStep.status !== "running" && subStep.status !== "retrying") {
    return null;
  }

  if (subStep.id === "cluster") {
    const phaseMsg = CLUSTER_PHASE_MESSAGES[step];
    if (globalMessage && phaseMsg && globalMessage !== phaseMsg) {
      return globalMessage;
    }
    return null;
  }

  if (subStep.id === "configuration") {
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
    infrastructure: { start: 0, end: 30 },
    cluster: { start: 30, end: 70 },
    configuration: { start: 70, end: 100 },
  };

  const hasInfra = subSteps.some((s) => s.id === "infrastructure");
  if (!hasInfra) {
    weights.cluster = { start: 0, end: 55 };
    weights.configuration = { start: 55, end: 100 };
  }

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

export function CloudClusterProgress() {
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

  const workerCount = state.clusterConfig.nodePools.reduce(
    (sum, pool) => sum + pool.machines.reduce((s, m) => s + m.nodeCount, 0),
    0
  ) || 2;

  const visualStage = deriveVisualStage(
    state.deploymentSubSteps,
    state.clusterCreationStep,
    state.clusterCreationProgress,
    false
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          {isComplete ? "Cluster Created!" : "Creating Your Cluster"}
        </h2>
        <p className="mt-2 text-zinc-400">
          {isComplete
            ? "Your cluster is ready"
            : "Please wait while we provision your infrastructure"}
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
          masterCount={1}
          workerCount={workerCount}
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
                  Your cluster has been successfully created in{" "}
                  {state.clusterConfig.region}.
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

/* ────────────────────────────────────────────────────
   Infrastructure Phase Tracker — shows init/plan/apply/finalize
   as a mini-pipeline with live detail messages
   ──────────────────────────────────────────────────── */
function InfraPhaseTracker({
  step,
  globalMessage,
  isSubStepCompleted,
}: {
  step: string;
  globalMessage: string;
  isSubStepCompleted: boolean;
}) {
  const currentIdx = getInfraPhaseIndex(step);

  // Track the highest phase index we've reached so phases stay checked
  const highWaterRef = useRef(-1);
  if (currentIdx > highWaterRef.current) {
    highWaterRef.current = currentIdx;
  }
  if (isSubStepCompleted) {
    highWaterRef.current = INFRA_PHASES.length;
  }
  const highWater = highWaterRef.current;

  // Track recent detail messages per phase
  const phaseLogsRef = useRef<Record<string, string[]>>({});
  const [phaseLogs, setPhaseLogs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (currentIdx < 0 || !globalMessage) return;
    const phaseId = INFRA_PHASES[currentIdx].id;
    const log = phaseLogsRef.current[phaseId] || [];
    if (log[log.length - 1] !== globalMessage) {
      log.push(globalMessage);
      if (log.length > 2) log.shift();
      phaseLogsRef.current[phaseId] = log;
      setPhaseLogs({ ...phaseLogsRef.current });
    }
  }, [globalMessage, currentIdx]);

  return (
    <div className="mt-2 ml-1 space-y-1">
      {INFRA_PHASES.map((phase, idx) => {
        const isDone = isSubStepCompleted || idx < highWater;
        const isActive = !isSubStepCompleted && idx === currentIdx;
        const isPending = !isDone && !isActive;
        const messages = phaseLogs[phase.id] || [];

        return (
          <div key={phase.id} className="flex items-start gap-2">
            {/* Phase icon */}
            <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
              {isDone && <CheckCircle className="size-3.5 text-green-400" />}
              {isActive && <Loader2 className="size-3.5 animate-spin text-blue-400" />}
              {isPending && <Circle className="size-3 text-zinc-600" />}
            </div>

            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isDone && "text-green-400/80",
                  isActive && "text-blue-300",
                  isPending && "text-zinc-600"
                )}
              >
                {phase.label}
              </span>

              {/* Detail messages for the active phase */}
              {isActive && messages.length > 0 && (
                <div className="mt-0.5 space-y-0">
                  {messages.map((msg, i) => {
                    const isCurrent = i === messages.length - 1;
                    return (
                      <p
                        key={`${msg}-${i}`}
                        className={cn(
                          "truncate text-[10px] leading-relaxed transition-opacity duration-300",
                          isCurrent ? "text-blue-300/70" : "text-zinc-600"
                        )}
                      >
                        <span className={isCurrent ? "text-blue-400/50" : "text-zinc-700"}>›</span>{" "}
                        {msg}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Generic SubStepRow
   ──────────────────────────────────────────────────── */
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
  const isInfra = subStep.id === "infrastructure";

  const phaseMessage = isInfra
    ? null
    : getSubStepPhaseMessage(subStep, step, playbook, globalMessage);
  const taskDetail = isInfra
    ? null
    : getSubStepTaskDetail(subStep, step, playbook, globalMessage);

  // Recent messages log for non-infra steps
  const recentRef = useRef<string[]>([]);
  const [recentMessages, setRecentMessages] = useState<string[]>([]);

  useEffect(() => {
    if (isInfra || !isActive || !taskDetail) return;
    const list = recentRef.current;
    if (list[list.length - 1] !== taskDetail) {
      list.push(taskDetail);
      if (list.length > 3) list.shift();
      setRecentMessages([...list]);
    }
  }, [taskDetail, isActive, isInfra]);

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

          {/* Infrastructure: show phase tracker only while active */}
          {isInfra && isActive && (
            <InfraPhaseTracker
              step={step}
              globalMessage={globalMessage}
              isSubStepCompleted={false}
            />
          )}

          {/* Non-infra: show phase message and recent detail ticker only while active */}
          {!isInfra && isActive && phaseMessage && (
            <p className="mt-1 truncate text-xs text-zinc-400">{phaseMessage}</p>
          )}

          {!isInfra && isActive && recentMessages.length > 0 && (
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
