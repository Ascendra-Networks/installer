export type CloudProvider = "aws" | "azure" | "gcp" | "on-premise" | "onpremise";

export type StorageClass = "standard" | "fast-ssd" | "balanced";

export type InstallationStatus = "pending" | "installing" | "completed" | "failed";

export type DeploymentSubStepId = 'infrastructure' | 'cluster' | 'configuration';

export type DeploymentSubStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface DeploymentSubStep {
  id: DeploymentSubStepId;
  status: DeploymentSubStepStatus;
  message: string;
  attempt: number;
  maxAttempts: number;
  error?: string;
}

export interface EnvVariable {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface MachineConfig {
  id: string;
  machineType: string;
  nodeCount: number;
}

export interface NodePool {
  id: string;
  name: string;
  machines: MachineConfig[];
  storageClass: StorageClass;
  storageSize: number; // in GB
  envVars?: EnvVariable[];
}

export interface ClusterConfig {
  name: string;
  region: string;
  vpc: string;
  subnet: string;
  nodePools: NodePool[];
  envVars?: EnvVariable[];
}

export interface Component {
  id: string;
  name: string;
  description: string;
  required: boolean;
  dependencies: string[];
  resourceRequirements: {
    cpu: string;
    memory: string;
    storage: string;
  };
}

export interface ComponentSelection {
  [componentId: string]: boolean;
}

export interface InstallationProgress {
  componentId: string;
  status: InstallationStatus;
  progress: number;
  message: string;
}

export interface WizardState {
  currentStep: number;
  cloudProvider: CloudProvider | null;
  clusterConfig: ClusterConfig;
  onPremiseConfig?: OnPremiseConfig;
  selectedComponents: ComponentSelection;
  clusterCreationProgress: number;
  clusterCreationStatus: InstallationStatus;
  clusterCreationMessage: string;
  clusterCreationPhase: string;
  clusterCreationStep: string;
  clusterCreationPlaybook: string;
  deploymentSubSteps: DeploymentSubStep[];
  installationProgress: InstallationProgress[];
  dashboardUrl: string | null;
  isComplete: boolean;
}

export interface WizardContextType {
  state: WizardState;
  isRestoring: boolean;
  setCloudProvider: (provider: CloudProvider) => void;
  setClusterConfig: (config: Partial<ClusterConfig>) => void;
  setOnPremiseConfig: (config: OnPremiseConfig) => void;
  setSelectedComponents: (components: ComponentSelection) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  startClusterCreation: () => Promise<void>;
  startInstallation: () => Promise<void>;
  retrySubStep: (subStepId: DeploymentSubStepId) => void;
  resetWizard: () => void;
}

export interface ProviderOption {
  id: CloudProvider;
  name: string;
  description: string;
  icon: string;
}

export interface RegionOption {
  value: string;
  label: string;
}

export interface MachineTypeOption {
  value: string;
  label: string;
  specs: string;
}

// On-Premise Types
export type OsType = 'ubuntu' | 'suse';

/** Optional per-node SSH override; when absent, group/control-plane SSH is used */
export interface OnPremiseNodeSSHOverride {
  user?: string;
  password?: string;
}

export interface OnPremiseNode {
  ip: string;
  hostname?: string;
  osType?: OsType;
  /** Optional per-node env (merged over group + cluster). Override for this node only. */
  envVars?: EnvVariable[];
  /** Optional per-node SSH override (e.g. node-specific password). When absent, use group/control-plane SSH. */
  sshConfig?: OnPremiseNodeSSHOverride;
}

export interface NodeTaint {
  key: string;
  value: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

export interface OnPremiseSSHConfig {
  user: string;
  password: string;
}

export interface OnPremiseNodeGroup {
  groupName: string;
  sshConfig: OnPremiseSSHConfig;
  labels?: Record<string, string>;
  taints?: NodeTaint[];
  nodes: OnPremiseNode[];
  envVars?: EnvVariable[];
}

export interface OnPremiseControlPlane {
  sshConfig: OnPremiseSSHConfig;
  nodes: OnPremiseNode[];
  envVars?: EnvVariable[];
}

export interface OnPremiseConfig {
  clusterName: string;
  controlPlane: OnPremiseControlPlane;
  workerNodes: OnPremiseNodeGroup[];
  envVars?: EnvVariable[];
}

export interface OnPremiseValidationResult {
  valid: boolean;
  error?: string;
  config?: OnPremiseConfig;
}

export interface SSHTestResult {
  success: boolean;
  ip: string;
  message?: string;
  error?: string;
  type?: 'master' | 'worker';
  group?: string;
  hostname?: string;
}

export interface SSHValidationResult {
  success: boolean;
  tested: number;
  passed: number;
  failed: number;
  nodes: SSHTestResult[];
  error?: string;
}

