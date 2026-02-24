import { useEffect, useRef, useState } from "react";
import { cn } from "../../ui/utils";
import {
  Server,
  Cpu,
  Network,
  Cloud,
  Globe,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { DeploymentSubStep } from "../../../types";

export const STAGE = {
  EMPTY: 0,
  VPC: 1,
  SUBNET: 2,
  MACHINES: 3,
  CLUSTER: 4,
  NETWORK: 5,
  COMPUTE: 6,
  COMPLETE: 7,
} as const;

export type VisualStage = (typeof STAGE)[keyof typeof STAGE];

export function deriveVisualStage(
  subSteps: DeploymentSubStep[],
  step: string,
  progress: number,
  isOnPremise: boolean
): VisualStage {
  const infra = subSteps.find((s) => s.id === "infrastructure");
  const cluster = subSteps.find((s) => s.id === "cluster");
  const config = subSteps.find((s) => s.id === "configuration");

  if (isOnPremise) {
    if (!cluster || cluster.status === "pending") return STAGE.MACHINES;
    if (cluster.status === "running" || cluster.status === "retrying") {
      if (step === "workers" || step === "status") return STAGE.CLUSTER;
      return STAGE.MACHINES;
    }
    if (cluster.status === "completed" || cluster.status === "failed") {
      return resolveConfigStage(config, step);
    }
    return STAGE.MACHINES;
  }

  if (!infra || infra.status === "pending") return STAGE.EMPTY;

  if (infra.status === "running" || infra.status === "retrying") {
    if (["starting", "init"].includes(step)) return STAGE.VPC;
    if (step === "plan") return STAGE.VPC;
    if (step === "apply") {
      if (progress < 30) return STAGE.SUBNET;
      return STAGE.MACHINES;
    }
    return STAGE.MACHINES;
  }

  if (infra.status === "failed") return STAGE.VPC;

  if (!cluster || cluster.status === "pending") return STAGE.MACHINES;
  if (cluster.status === "running" || cluster.status === "retrying") {
    if (step === "workers" || step === "status") return STAGE.CLUSTER;
    return STAGE.MACHINES;
  }
  if (cluster.status === "completed" || cluster.status === "failed") {
    return resolveConfigStage(config, step);
  }

  return STAGE.MACHINES;
}

function resolveConfigStage(
  config: DeploymentSubStep | undefined,
  step: string
): VisualStage {
  if (!config || config.status === "pending") return STAGE.CLUSTER;
  if (config.status === "running" || config.status === "retrying") {
    if (["kubevirt-waiting", "network-waiting"].includes(step)) return STAGE.COMPUTE;
    if (["verification", "summary"].includes(step)) return STAGE.COMPLETE;
    return STAGE.NETWORK;
  }
  if (config.status === "completed") return STAGE.COMPLETE;
  return STAGE.NETWORK;
}

const STAGE_LABELS: Record<VisualStage, string> = {
  [STAGE.EMPTY]: "Preparing deployment...",
  [STAGE.VPC]: "Creating private cloud network...",
  [STAGE.SUBNET]: "Creating subnet...",
  [STAGE.MACHINES]: "Provisioning machines...",
  [STAGE.CLUSTER]: "Forming cluster...",
  [STAGE.NETWORK]: "Creating virtual network...",
  [STAGE.COMPUTE]: "Creating virtual compute...",
  [STAGE.COMPLETE]: "All systems operational",
};

const STAGE_DELAY_MS = 2000;

function useDelayedStage(targetStage: VisualStage): VisualStage {
  const [displayedStage, setDisplayedStage] = useState<VisualStage>(targetStage);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<VisualStage>(targetStage);

  useEffect(() => {
    queueRef.current = targetStage;

    if (targetStage <= displayedStage) {
      // Target went backwards or same — update immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayedStage(targetStage);
      return;
    }

    // Target is ahead — step forward one stage at a time with a delay
    function stepForward() {
      setDisplayedStage((prev) => {
        const next = (prev + 1) as VisualStage;
        if (next < queueRef.current) {
          timerRef.current = setTimeout(stepForward, STAGE_DELAY_MS);
        } else {
          timerRef.current = null;
        }
        return Math.min(next, queueRef.current) as VisualStage;
      });
    }

    if (!timerRef.current) {
      timerRef.current = setTimeout(stepForward, STAGE_DELAY_MS);
    }

    return () => {
      // Don't clear on every render — only on unmount
    };
  }, [targetStage, displayedStage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return displayedStage;
}

interface InfrastructureVisualProps {
  stage: VisualStage;
  masterCount?: number;
  workerCount?: number;
  isOnPremise?: boolean;
  isActive?: boolean;
}

export function InfrastructureVisual({
  stage: targetStage,
  masterCount = 1,
  workerCount = 2,
  isOnPremise = false,
  isActive = true,
}: InfrastructureVisualProps) {
  const stage = useDelayedStage(targetStage);

  const showVpc = isOnPremise || stage >= STAGE.VPC;
  const showSubnet = isOnPremise || stage >= STAGE.SUBNET;
  const showMachines = isOnPremise || stage >= STAGE.MACHINES;
  const showCluster = stage >= STAGE.CLUSTER;
  const showNetwork = stage >= STAGE.NETWORK;
  const showCompute = stage >= STAGE.COMPUTE;
  const isComplete = stage >= STAGE.COMPLETE;

  const isBuilding = isActive && !isComplete;
  const label = STAGE_LABELS[stage];
  const vpcMaterializing = showVpc && !showSubnet && isBuilding;

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden rounded-xl border bg-zinc-950/80 p-1 transition-colors duration-500",
          isBuilding ? "border-zinc-700" : isComplete ? "border-green-500/20" : "border-zinc-800"
        )}
      >
        {isBuilding && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
            <div
              className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-blue-500/[0.04] to-transparent"
              style={{ animation: "shimmer 3s ease-in-out infinite" }}
            />
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-200%) skewX(-12deg); }
                100% { transform: translateX(500%) skewX(-12deg); }
              }
            `}</style>
          </div>
        )}

        {/* VPC layer */}
        <div
          className={cn(
            "relative flex flex-1 flex-col rounded-lg border-2 p-2.5 transition-all duration-700",
            showVpc ? "opacity-100 scale-100" : "opacity-0 scale-95",
            isComplete
              ? "border-green-500/40 bg-green-500/[0.03]"
              : vpcMaterializing
                ? "border-blue-500/20 bg-blue-500/[0.02]"
                : showVpc
                  ? "border-blue-500/30 bg-blue-500/[0.02]"
                  : "border-zinc-800",
            vpcMaterializing && "animate-pulse"
          )}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            {isOnPremise ? (
              <Server className="size-3 text-zinc-500" />
            ) : (
              <Cloud
                className={cn(
                  "size-3 transition-colors duration-500",
                  vpcMaterializing ? "text-blue-400/60" : "text-zinc-500"
                )}
              />
            )}
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider transition-colors duration-500",
                vpcMaterializing ? "text-blue-400/60" : "text-zinc-500"
              )}
            >
              {isOnPremise ? "On-Premise Network" : "Private Cloud Network"}
            </span>
            {vpcMaterializing && (
              <Loader2 className="ml-auto size-3 animate-spin text-blue-400/50" />
            )}
          </div>

          {/* Subnet layer */}
          <div
            className={cn(
              "flex flex-1 flex-col rounded-md border p-2.5 transition-all duration-700 delay-200",
              showSubnet ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]",
              isComplete
                ? "border-green-500/30 bg-green-500/[0.03]"
                : showSubnet
                  ? "border-zinc-700 bg-zinc-900/50"
                  : "border-transparent"
            )}
          >
            {!isOnPremise && (
              <div className="mb-2 flex items-center gap-1.5">
                <Globe className="size-3 text-zinc-600" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Subnet
                </span>
              </div>
            )}

            {/* Machine nodes + Virtual Network bus */}
            <div className="flex flex-1 flex-col items-center justify-center gap-0">
              {/* Nodes row */}
              <div
                className={cn(
                  "flex flex-wrap items-end justify-center gap-2 transition-all duration-700 delay-300",
                  showMachines ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                {Array.from({ length: masterCount }).map((_, i) => (
                  <MachineNode
                    key={`master-${i}`}
                    label="Master"
                    visible={showMachines}
                    clustered={showCluster}
                    hasNetwork={showNetwork}
                    hasCompute={showCompute}
                    isComplete={isComplete}
                    delay={i * 150}
                  />
                ))}

                {Array.from({ length: workerCount }).map((_, i) => (
                  <MachineNode
                    key={`worker-${i}`}
                    label={`Worker ${i + 1}`}
                    visible={showMachines}
                    clustered={showCluster}
                    hasNetwork={showNetwork}
                    hasCompute={showCompute}
                    isComplete={isComplete}
                    delay={(masterCount + i) * 150}
                  />
                ))}
              </div>

              {/* Virtual Network — shared bus connecting all nodes */}
              <div
                className={cn(
                  "mt-1.5 flex w-full items-center gap-2 rounded-md border px-3 py-1 transition-all duration-700",
                  showNetwork ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50",
                  isComplete
                    ? "border-green-500/30 bg-green-500/[0.06]"
                    : showNetwork
                      ? "border-purple-500/30 bg-purple-500/[0.06]"
                      : "border-transparent"
                )}
              >
                <Network
                  className={cn(
                    "size-3 shrink-0 transition-colors duration-500",
                    isComplete ? "text-green-400" : "text-purple-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-medium uppercase tracking-wider transition-colors duration-500",
                    isComplete ? "text-green-400/70" : "text-purple-400/70"
                  )}
                >
                  Virtual Network
                </span>
              </div>
            </div>
          </div>

          {/* Placeholder when VPC visible but subnet not yet */}
          {showVpc && !showSubnet && !isOnPremise && (
            <div className="flex flex-1 items-center justify-center py-5">
              <div className="flex items-center gap-2 text-zinc-600">
                <div className="flex gap-1">
                  <span className="inline-block size-1.5 animate-bounce rounded-full bg-blue-400/40" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block size-1.5 animate-bounce rounded-full bg-blue-400/40" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block size-1.5 animate-bounce rounded-full bg-blue-400/40" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[11px]">Preparing resources</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage label */}
      {label && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {isBuilding && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
          )}
          {isComplete && <CheckCircle2 className="size-3.5 text-green-400" />}
          <span
            className={cn(
              "text-xs font-medium",
              isComplete ? "text-green-400" : "text-zinc-400"
            )}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Machine node — contains server, network connector, and VMs
   ──────────────────────────────────────────────────── */
function MachineNode({
  label,
  visible,
  clustered,
  hasNetwork,
  hasCompute,
  isComplete,
  delay = 0,
}: {
  label: string;
  visible: boolean;
  clustered: boolean;
  hasNetwork: boolean;
  hasCompute: boolean;
  isComplete: boolean;
  delay?: number;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "flex w-20 flex-col items-center rounded-lg border p-1.5 transition-all duration-500",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-90",
          isComplete
            ? "border-green-500/30 bg-green-500/[0.05]"
            : clustered
              ? "border-blue-500/30 bg-blue-500/[0.05]"
              : visible
                ? "border-zinc-700 bg-zinc-900/80"
                : "border-transparent"
        )}
      >
        <Server
          className={cn(
            "size-4 transition-colors duration-500",
            isComplete
              ? "text-green-400"
              : clustered
                ? "text-blue-400"
                : "text-zinc-500"
          )}
        />
        <span
          className={cn(
            "mt-0.5 text-[9px] font-medium transition-colors duration-500",
            isComplete
              ? "text-green-300"
              : clustered
                ? "text-blue-300"
                : "text-zinc-500"
          )}
        >
          {label}
        </span>

        {/* Virtual compute chips */}
        <div
          className={cn(
            "mt-1 flex gap-1 transition-all duration-500",
            hasCompute ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}
        >
          <Cpu
            className={cn(
              "size-2.5 transition-colors duration-500",
              isComplete ? "text-green-400/70" : "text-amber-400/70"
            )}
          />
          <Cpu
            className={cn(
              "size-2.5 transition-colors duration-500",
              isComplete ? "text-green-400/70" : "text-amber-400/70"
            )}
          />
        </div>
      </div>

      {/* Connector line down to the Virtual Network bus */}
      <div
        className={cn(
          "h-3 w-px transition-all duration-500",
          hasNetwork ? "opacity-100" : "opacity-0",
          isComplete ? "bg-green-500/40" : "bg-purple-500/40"
        )}
      />
    </div>
  );
}
