import { useState, useEffect } from "react";
import { Button } from "../../../ui/button";
import { Card, CardContent } from "../../../ui/card";
import { useWizard } from "../../../../contexts/WizardContext";
import { installerService } from "../../../../services/installer.service";
import { isClusterConfigValid } from "../../../../utils/validators";
import { NodePool, MachineTypeOption, EnvVariable } from "../../../../types";
import { EnvVariablesEditor } from "../../../shared/EnvVariablesEditor";
import { ClusterSettings } from "./ClusterSettings";
import { NodePools } from "./NodePools";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { NodePoolDialog } from "./NodePoolDialog";

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

  // Machine types for node pool dialog
  const [machineTypes, setMachineTypes] = useState<MachineTypeOption[]>([]);
  const [loadingMachineTypes, setLoadingMachineTypes] = useState(false);

  // Fetch machine types when region changes
  useEffect(() => {
    setMachineTypes([]);

    if (state.cloudProvider && state.clusterConfig.region) {
      setLoadingMachineTypes(true);
      installerService
        .getMachineTypes(state.cloudProvider, state.clusterConfig.region)
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
    </div>
  );
}
