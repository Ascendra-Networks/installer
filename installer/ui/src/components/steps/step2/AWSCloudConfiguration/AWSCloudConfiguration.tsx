import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Button } from "../../../ui/button";
import { Card, CardContent } from "../../../ui/card";
import { useWizard } from "../../../../contexts/WizardContext";
import { awsService } from "../../../../services/aws.service";
import { isClusterConfigValid } from "../../../../utils/validators";
import { NodePool, MachineTypeOption, EnvVariable, ProxyConfig } from "../../../../types";
import { EnvVariablesEditor } from "../../../shared/EnvVariablesEditor";
import { ClusterSettings } from "./ClusterSettings";
import { NodePools } from "./NodePools";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { NodePoolDialog } from "./NodePoolDialog";
import { ProxyConfigDialog } from "./ProxyConfigDialog";
import { wizardStateService } from "../../../../services/wizard-state.service";

/**
 * AWSCloudConfiguration Component
 * 
 * Main component for AWS cloud configuration in Step 2 of the wizard.
 * Manages cluster settings, node pools, and configuration summary.
 */
export function AWSCloudConfiguration() {
  const { state, setClusterConfig, nextStep, previousStep } = useWizard();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<NodePool | undefined>();
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);

  // Machine types for node pool dialog
  const [machineTypes, setMachineTypes] = useState<MachineTypeOption[]>([]);
  const [loadingMachineTypes, setLoadingMachineTypes] = useState(false);

  // Fetch machine types when region changes
  useEffect(() => {
    setMachineTypes([]);

    if (state.cloudProvider && state.clusterConfig.region) {
      setLoadingMachineTypes(true);
      awsService
        .getMachineTypes(state.clusterConfig.region)
        .then((data) => {
          setMachineTypes(data);
          console.log(
            `Loaded ${data.length} machine types for region ${state.clusterConfig.region}`
          );
        })
        .catch((err) => {
          console.error("Failed to fetch machine types:", err);
          setMachineTypes([]);
        })
        .finally(() => setLoadingMachineTypes(false));
    }
  }, [state.cloudProvider, state.clusterConfig.region]);

  const openCreateDialog = () => {
    setEditingPool(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (pool: NodePool) => {
    setEditingPool(pool);
    setDialogOpen(true);
  };

  const handleSavePool = (pool: NodePool) => {
    if (editingPool) {
      // Edit existing pool
      setClusterConfig({
        nodePools: state.clusterConfig.nodePools.map((p) =>
          p.id === pool.id ? pool : p
        ),
      });
    } else {
      // Add new pool
      setClusterConfig({
        nodePools: [...state.clusterConfig.nodePools, pool],
      });
    }
  };

  const removeNodePool = (id: string) => {
    setClusterConfig({
      nodePools: state.clusterConfig.nodePools.filter((pool) => pool.id !== id),
    });
  };

  const handleSaveProxy = (proxyConfig: ProxyConfig) => {
    setClusterConfig({ proxyConfig });
    wizardStateService.applyAnsibleConfig({
      cloudProvider: state.cloudProvider,
      clusterConfig: { ...state.clusterConfig, proxyConfig },
      selectedComponents: state.selectedComponents,
    }).catch(console.error);
  };

  const proxy = state.clusterConfig.proxyConfig;

  const handleContinue = () => {
    if (isClusterConfigValid(state.clusterConfig)) {
      nextStep();
    }
  };

  const canContinue = isClusterConfigValid(state.clusterConfig);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">AWS Cloud Configuration</h2>
        <p className="mt-2 text-zinc-400">
          Configure your cluster settings and node pools for AWS deployment
        </p>
      </div>

      {/* Cluster Settings */}
      <ClusterSettings />

      {/* Node Pools */}
      <NodePools
        nodePools={state.clusterConfig.nodePools}
        onAddPool={openCreateDialog}
        onEditPool={openEditDialog}
        onRemovePool={removeNodePool}
        loadingMachineTypes={loadingMachineTypes}
        regionSelected={!!state.clusterConfig.region}
      />

      {/* Cluster Environment Variables */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-6">
          <EnvVariablesEditor
            envVars={state.clusterConfig.envVars || []}
            onChange={(envVars: EnvVariable[]) => setClusterConfig({ envVars })}
            title="Cluster Environment Variables"
          />
        </CardContent>
      </Card>

      {/* Proxy Configuration */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  proxy?.enabled
                    ? "bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20"
                    : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <Shield
                  className={`size-4 ${proxy?.enabled ? "text-white" : "text-zinc-500"}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Proxy Configuration</p>
                {proxy?.enabled ? (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    <span className="text-violet-400 font-medium">Enabled</span>
                    {" · "}
                    <span className="capitalize">
                      {proxy.mode === "grouped"
                        ? "Grouped"
                        : proxy.mode === "protocol"
                        ? "Per Protocol"
                        : "Granular"}
                    </span>
                    {proxy.HTTP_PROXY && (
                      <>
                        {" · "}
                        <span className="font-mono text-zinc-300">{proxy.HTTP_PROXY}</span>
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-0.5">No proxy configured</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProxyDialogOpen(true)}
              className="border-zinc-700 hover:bg-zinc-800 hover:border-violet-500/50 hover:text-violet-300 transition-colors"
            >
              {proxy?.enabled ? "Edit Proxy" : "Configure Proxy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <ConfigurationSummary
        nodePools={state.clusterConfig.nodePools}
        region={state.clusterConfig.region}
        clusterName={state.clusterConfig.name}
      />

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!canContinue}
          className="min-w-32"
        >
          Continue
        </Button>
      </div>

      {/* Node Pool Dialog */}
      <NodePoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSavePool}
        machineTypes={machineTypes}
        editPool={editingPool}
      />

      {/* Proxy Config Dialog */}
      <ProxyConfigDialog
        open={proxyDialogOpen}
        onOpenChange={setProxyDialogOpen}
        proxyConfig={state.clusterConfig.proxyConfig}
        onSave={handleSaveProxy}
      />
    </div>
  );
}
