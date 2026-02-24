import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  WizardState,
  WizardContextType,
  CloudProvider,
  ClusterConfig,
  ComponentSelection,
  InstallationStatus,
  OnPremiseConfig,
  DeploymentSubStepId,
  DeploymentSubStep,
} from "../types";
import { installerService, initializeWebSocket, getSocket, closeWebSocket } from "../services/installer.service";

function buildInitialSubSteps(isOnPremise: boolean): DeploymentSubStep[] {
  const steps: DeploymentSubStep[] = [];
  if (!isOnPremise) {
    steps.push({ id: 'infrastructure', status: 'pending', message: '', attempt: 0, maxAttempts: 3 });
  }
  steps.push({ id: 'cluster', status: 'pending', message: '', attempt: 0, maxAttempts: 3 });
  steps.push({ id: 'configuration', status: 'pending', message: '', attempt: 0, maxAttempts: 3 });
  return steps;
}

const initialState: WizardState = {
  currentStep: 1,
  cloudProvider: null,
  clusterConfig: {
    name: "",
    region: "",
    vpc: "",
    subnet: "",
    nodePools: [],
  },
  onPremiseConfig: undefined,
  selectedComponents: {},
  clusterCreationProgress: 0,
  clusterCreationStatus: "pending",
  clusterCreationMessage: "",
  clusterCreationPhase: "",
  clusterCreationStep: "",
  clusterCreationPlaybook: "",
  deploymentSubSteps: [],
  installationProgress: [],
  dashboardUrl: null,
  isComplete: false,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 1000;

export function WizardProvider({
  children,
  initialState: customInitialState
}: {
  children: React.ReactNode;
  initialState?: Partial<WizardState>;
}) {
  const [state, setState] = useState<WizardState>({ ...initialState, ...customInitialState });
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(true);

  // --- Restore persisted wizard state on mount ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await installerService.getWizardState();
        if (!cancelled && saved && saved.currentStep) {
          const { savedAt, deploymentId: savedDeploymentId, ...wizardFields } = saved;
          setState((prev) => ({ ...prev, ...wizardFields }));
          if (savedDeploymentId) {
            setDeploymentId(savedDeploymentId);
          }
          console.log('[WizardContext] Restored wizard state from backend (saved at', savedAt, ')');
        }
      } catch (err) {
        console.warn('[WizardContext] Could not restore wizard state:', err);
      } finally {
        if (!cancelled) {
          isRestoringRef.current = false;
          setIsRestoring(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // --- Auto-save wizard state on changes (debounced) ---
  useEffect(() => {
    if (isRestoringRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const payload = {
        currentStep: state.currentStep,
        cloudProvider: state.cloudProvider,
        clusterConfig: state.clusterConfig,
        onPremiseConfig: state.onPremiseConfig,
        selectedComponents: state.selectedComponents,
        clusterCreationProgress: state.clusterCreationProgress,
        clusterCreationStatus: state.clusterCreationStatus,
        clusterCreationMessage: state.clusterCreationMessage,
        clusterCreationPhase: state.clusterCreationPhase,
        clusterCreationStep: state.clusterCreationStep,
        clusterCreationPlaybook: state.clusterCreationPlaybook,
        deploymentSubSteps: state.deploymentSubSteps,
        installationProgress: state.installationProgress,
        dashboardUrl: state.dashboardUrl,
        isComplete: state.isComplete,
        deploymentId,
      };

      installerService.saveWizardState(payload).catch((err) => {
        console.warn('[WizardContext] Failed to persist wizard state:', err);
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, deploymentId]);

  useEffect(() => {
    const socket = initializeWebSocket();
    return () => {
      closeWebSocket();
    };
  }, []);

  useEffect(() => {
    if (!deploymentId) return;

    const socket = getSocket();
    if (!socket) return;

    console.log(`[WizardContext] Setting up WebSocket listeners for deployment: ${deploymentId}`);
    socket.emit('deployment:join', deploymentId);

    socket.on('deployment:progress', (data: any) => {
      console.log('[WizardContext] Progress update:', data);

      setState((prev) => ({
        ...prev,
        clusterCreationProgress: Math.max(prev.clusterCreationProgress, data.progress || 0),
        clusterCreationStatus: 'installing',
        clusterCreationMessage: data.message || '',
        clusterCreationPhase: data.phase || '',
        clusterCreationStep: data.step || '',
        clusterCreationPlaybook: data.playbook || prev.clusterCreationPlaybook,
      }));
    });

    socket.on('deployment:substep', (data: any) => {
      console.log('[WizardContext] Sub-step update:', data);

      setState((prev) => ({
        ...prev,
        // Reset progress when a new sub-step starts so computeOverallProgress calculates correctly
        clusterCreationProgress: data.status === 'running' ? 0 : prev.clusterCreationProgress,
        deploymentSubSteps: prev.deploymentSubSteps.map((s) =>
          s.id === data.subStepId
            ? {
                ...s,
                status: data.status,
                message: data.message || '',
                attempt: data.attempt ?? s.attempt,
                maxAttempts: data.maxAttempts ?? s.maxAttempts,
                error: data.error,
              }
            : s
        ),
      }));
    });

    socket.on('deployment:completed', (data: any) => {
      console.log('[WizardContext] Deployment completed:', data);
      setState((prev) => ({
        ...prev,
        clusterCreationStatus: 'completed',
        clusterCreationProgress: 100,
        clusterCreationMessage: 'Deployment completed successfully',
        deploymentSubSteps: prev.deploymentSubSteps.map((s) => ({
          ...s,
          status: s.status === 'pending' ? 'completed' : s.status,
        })) as DeploymentSubStep[],
      }));
    });

    socket.on('deployment:failed', (data: any) => {
      console.error('[WizardContext] Deployment failed:', data);
      setState((prev) => ({
        ...prev,
        clusterCreationStatus: 'failed',
        clusterCreationMessage: data.error || 'Deployment failed',
      }));
    });

    socket.on('deployment:cancelled', (data: any) => {
      console.log('[WizardContext] Deployment cancelled:', data);
      setState((prev) => ({
        ...prev,
        clusterCreationStatus: 'failed',
        clusterCreationMessage: 'Deployment cancelled',
      }));
    });

    // Installation (step 5) events
    socket.on('installation:progress', (data: any) => {
      console.log('[WizardContext] Installation progress:', data);
      setState((prev) => ({
        ...prev,
        dashboardUrl: data.dashboardUrl || prev.dashboardUrl,
        installationProgress: prev.installationProgress.map((p) =>
          p.componentId === data.componentId
            ? {
                ...p,
                status: data.status as InstallationStatus,
                progress: data.progress ?? p.progress,
                message: data.message || p.message,
              }
            : p
        ),
      }));
    });

    socket.on('installation:completed', (data: any) => {
      console.log('[WizardContext] Installation completed:', data);
      setState((prev) => ({
        ...prev,
        installationProgress: prev.installationProgress.map((p) => ({
          ...p,
          status: p.status === 'pending' ? 'completed' : p.status,
        })) as typeof prev.installationProgress,
        dashboardUrl: data.dashboardUrl || prev.dashboardUrl,
        isComplete: true,
      }));
    });

    socket.on('installation:failed', (data: any) => {
      console.error('[WizardContext] Installation failed:', data);
    });

    return () => {
      socket.off('deployment:progress');
      socket.off('deployment:substep');
      socket.off('deployment:completed');
      socket.off('deployment:failed');
      socket.off('deployment:cancelled');
      socket.off('installation:progress');
      socket.off('installation:completed');
      socket.off('installation:failed');
      socket.emit('deployment:leave', deploymentId);
    };
  }, [deploymentId]);

  const setCloudProvider = useCallback((provider: CloudProvider) => {
    setState((prev) => ({
      ...prev,
      cloudProvider: provider,
    }));
  }, []);

  const setClusterConfig = useCallback((config: Partial<ClusterConfig>) => {
    setState((prev) => ({
      ...prev,
      clusterConfig: {
        ...prev.clusterConfig,
        ...config,
      },
    }));
  }, []);

  const setOnPremiseConfig = useCallback((config: OnPremiseConfig) => {
    setState((prev) => ({
      ...prev,
      onPremiseConfig: config,
      clusterConfig: {
        ...prev.clusterConfig,
        name: config.clusterName || prev.clusterConfig.name,
      },
    }));
  }, []);

  const setSelectedComponents = useCallback((components: ComponentSelection) => {
    setState((prev) => ({
      ...prev,
      selectedComponents: components,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 5),
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(1, Math.min(step, 5)),
    }));
  }, []);

  const startClusterCreation = useCallback(async () => {
    const isOnPremise = state.cloudProvider === 'on-premise' || state.cloudProvider === 'onpremise';

    const subSteps = buildInitialSubSteps(isOnPremise);
    subSteps[0] = { ...subSteps[0], status: 'running' };

    setState((prev) => ({
      ...prev,
      clusterCreationStatus: "installing",
      clusterCreationProgress: 0,
      clusterCreationMessage: "",
      clusterCreationPhase: isOnPremise ? "ansible" : "terraform",
      clusterCreationStep: isOnPremise ? "prerequisites" : "starting",
      clusterCreationPlaybook: "",
      deploymentSubSteps: subSteps,
    }));

    try {
      const deployment = await installerService.createDeployment({
        cloudProvider: state.cloudProvider!,
        clusterConfig: state.clusterConfig,
        onPremiseConfig: state.onPremiseConfig,
        selectedComponents: state.selectedComponents,
      });

      console.log('[WizardContext] Created deployment:', deployment.id);
      setDeploymentId(deployment.id);

      const socket = getSocket();
      if (socket) {
        socket.emit('deployment:start', deployment.id);
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      console.error('[WizardContext] Failed to start deployment:', error);
      setState((prev) => ({
        ...prev,
        clusterCreationStatus: "failed",
      }));
    }
  }, [state.cloudProvider, state.clusterConfig, state.onPremiseConfig, state.selectedComponents]);

  const startInstallation = useCallback(async () => {
    const selectedComponentIds = Object.keys(state.selectedComponents).filter(
      (id) => state.selectedComponents[id]
    );

    if (selectedComponentIds.length === 0) {
      setState((prev) => ({
        ...prev,
        installationProgress: [],
        isComplete: true,
      }));
      return;
    }

    const initialProgress = selectedComponentIds.map((id) => ({
      componentId: id,
      status: "pending" as InstallationStatus,
      progress: 0,
      message: "Waiting to start...",
    }));

    setState((prev) => ({
      ...prev,
      isComplete: false,
      installationProgress: initialProgress,
    }));

    const socket = getSocket();
    if (!socket || !deploymentId) {
      console.error('[WizardContext] Cannot start installation: no socket or deployment');
      setState((prev) => ({
        ...prev,
        installationProgress: selectedComponentIds.map((id) => ({
          componentId: id,
          status: "failed" as InstallationStatus,
          progress: 0,
          message: "Connection error",
        })),
      }));
      return;
    }

    console.log('[WizardContext] Starting component installation for deployment:', deploymentId);
    socket.emit('deployment:install-components', {
      deploymentId,
      selectedComponents: state.selectedComponents,
    });
  }, [state.selectedComponents, deploymentId]);

  const retrySubStep = useCallback((subStepId: DeploymentSubStepId) => {
    if (!deploymentId) return;

    const socket = getSocket();
    if (!socket) return;

    console.log(`[WizardContext] Requesting retry for sub-step: ${subStepId}`);

    setState((prev) => ({
      ...prev,
      deploymentSubSteps: prev.deploymentSubSteps.map((s) =>
        s.id === subStepId ? { ...s, status: 'retrying' as const, message: 'Retrying...', error: undefined } : s
      ),
    }));

    socket.emit('deployment:retry', { deploymentId, subStepId });
  }, [deploymentId]);

  const resetWizard = useCallback(() => {
    setState(initialState);
    setDeploymentId(null);
    installerService.clearWizardState().catch(() => {});
  }, []);

  const value: WizardContextType = {
    state,
    isRestoring,
    setCloudProvider,
    setClusterConfig,
    setOnPremiseConfig,
    setSelectedComponents,
    nextStep,
    previousStep,
    goToStep,
    startClusterCreation,
    startInstallation,
    retrySubStep,
    resetWizard,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
