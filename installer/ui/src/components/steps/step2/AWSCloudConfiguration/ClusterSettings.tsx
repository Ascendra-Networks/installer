import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { FormField, SearchableSelectField } from "../../../shared/form";
import { LoadingIndicator } from "../../../shared/loading/LoadingIndicator";
import { installerService } from "../../../../services/installer.service";
import { validateClusterName } from "../../../../utils/validators";
import { useWizard } from "../../../../contexts/WizardContext";
import { RegionOption } from "../../../../types";
import { CreateVpcDialog } from "./CreateVpcDialog";
import { CreateSubnetDialog } from "./CreateSubnetDialog";

/**
 * ClusterSettings Component
 * 
 * Manages cluster name, region, VPC, and subnet configuration for AWS deployments.
 * Includes search functionality for all dropdowns and ability to create new VPCs/Subnets.
 */
export function ClusterSettings() {
  const { state, setClusterConfig } = useWizard();
  const [nameError, setNameError] = useState<string | null>(null);
  const [createVpcDialogOpen, setCreateVpcDialogOpen] = useState(false);
  const [createSubnetDialogOpen, setCreateSubnetDialogOpen] = useState(false);

  // Dynamic data fetching
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [vpcs, setVpcs] = useState<RegionOption[]>([]);
  const [subnets, setSubnets] = useState<RegionOption[]>([]);

  // Loading states
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingVpcs, setLoadingVpcs] = useState(false);
  const [loadingSubnets, setLoadingSubnets] = useState(false);

  // Fetch regions when provider changes
  useEffect(() => {
    if (state.cloudProvider) {
      setLoadingRegions(true);
      installerService.getRegions(state.cloudProvider)
        .then(setRegions)
        .catch((err) => {
          console.error('Failed to fetch regions:', err);
          setRegions([]);
        })
        .finally(() => setLoadingRegions(false));
    }
  }, [state.cloudProvider]);

  // Fetch VPCs when region changes
  useEffect(() => {
    setVpcs([]);

    if (state.cloudProvider && state.clusterConfig.region) {
      setLoadingVpcs(true);
      installerService.getVPCs(state.cloudProvider, state.clusterConfig.region)
        .then((data) => {
          setVpcs(data);
          console.log(`Loaded ${data.length} VPCs for region ${state.clusterConfig.region}`);
        })
        .catch((err) => {
          console.error('Failed to fetch VPCs:', err);
          setVpcs([]);
        })
        .finally(() => setLoadingVpcs(false));
    }
  }, [state.cloudProvider, state.clusterConfig.region]);

  // Fetch subnets when region or VPC changes
  useEffect(() => {
    setSubnets([]);

    if (state.cloudProvider && state.clusterConfig.region) {
      setLoadingSubnets(true);
      installerService.getSubnets(
        state.cloudProvider,
        state.clusterConfig.region,
        state.clusterConfig.vpc
      )
        .then((data) => {
          setSubnets(data);
          console.log(`Loaded ${data.length} subnets for region ${state.clusterConfig.region}`);
        })
        .catch((err) => {
          console.error('Failed to fetch subnets:', err);
          setSubnets([]);
        })
        .finally(() => setLoadingSubnets(false));
    }
  }, [state.cloudProvider, state.clusterConfig.region, state.clusterConfig.vpc]);

  const handleNameChange = (value: string) => {
    setClusterConfig({ name: value });
    const error = validateClusterName(value);
    setNameError(error);
  };

  const handleVpcCreated = (vpcId: string) => {
    if (state.cloudProvider && state.clusterConfig.region) {
      setLoadingVpcs(true);
      installerService.getVPCs(state.cloudProvider, state.clusterConfig.region)
        .then((data) => {
          setVpcs(data);
          setClusterConfig({ vpc: vpcId, subnet: '' });
        })
        .finally(() => setLoadingVpcs(false));
    }
  };

  const handleSubnetCreated = (subnetId: string) => {
    if (state.cloudProvider && state.clusterConfig.region) {
      setLoadingSubnets(true);
      installerService.getSubnets(
        state.cloudProvider,
        state.clusterConfig.region,
        state.clusterConfig.vpc
      )
        .then((data) => {
          setSubnets(data);
          setClusterConfig({ subnet: subnetId });
        })
        .finally(() => setLoadingSubnets(false));
    }
  };

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Cluster Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              id="cluster-name"
              label="Cluster Name"
              placeholder="my-cluster"
              value={state.clusterConfig.name}
              onChange={handleNameChange}
              error={nameError || undefined}
              required
            />

            <SearchableSelectField
              id="region"
              label="Region"
              placeholder="Select a region"
              value={state.clusterConfig.region}
              onChange={(value) => {
                setClusterConfig({ region: value, vpc: '', subnet: '' });
              }}
              options={regions}
              loading={loadingRegions}
              customTrigger={loadingRegions ? <LoadingIndicator text="Loading regions..." /> : undefined}
              required
              searchPlaceholder="Search regions..."
            />

            <SearchableSelectField
              id="vpc"
              label="VPC / Virtual Network"
              placeholder={state.clusterConfig.region ? "Select a VPC" : "Select region first"}
              value={state.clusterConfig.vpc}
              onChange={(value) => {
                setClusterConfig({ vpc: value, subnet: '' });
              }}
              options={vpcs}
              disabled={!state.clusterConfig.region || loadingVpcs}
              loading={loadingVpcs}
              customTrigger={loadingVpcs ? <LoadingIndicator text="Loading VPCs..." /> : undefined}
              labelAction={
                state.cloudProvider === 'aws' && state.clusterConfig.region ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateVpcDialogOpen(true)}
                    className="h-auto p-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Sparkles className="size-3 mr-1" />
                    Create New
                  </Button>
                ) : undefined
              }
              required
              searchPlaceholder="Search VPCs..."
            />

            <SearchableSelectField
              id="subnet"
              label="Subnet"
              placeholder={state.clusterConfig.region ? "Select a subnet" : "Select region first"}
              value={state.clusterConfig.subnet}
              onChange={(value) => setClusterConfig({ subnet: value })}
              options={subnets}
              disabled={!state.clusterConfig.region || loadingSubnets}
              loading={loadingSubnets}
              customTrigger={loadingSubnets ? <LoadingIndicator text="Loading subnets..." /> : undefined}
              labelAction={
                state.cloudProvider === 'aws' && state.clusterConfig.region && state.clusterConfig.vpc ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateSubnetDialogOpen(true)}
                    className="h-auto p-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Sparkles className="size-3 mr-1" />
                    Create New
                  </Button>
                ) : undefined
              }
              required
              searchPlaceholder="Search subnets..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Create VPC Dialog */}
      {state.cloudProvider === 'aws' && state.clusterConfig.region && (
        <CreateVpcDialog
          open={createVpcDialogOpen}
          onOpenChange={setCreateVpcDialogOpen}
          region={state.clusterConfig.region}
          cloudProvider={state.cloudProvider}
          clusterName={state.clusterConfig.name}
          onVpcCreated={handleVpcCreated}
        />
      )}

      {/* Create Subnet Dialog */}
      {state.cloudProvider === 'aws' && state.clusterConfig.region && state.clusterConfig.vpc && (
        <CreateSubnetDialog
          open={createSubnetDialogOpen}
          onOpenChange={setCreateSubnetDialogOpen}
          region={state.clusterConfig.region}
          vpcId={state.clusterConfig.vpc}
          cloudProvider={state.cloudProvider}
          clusterName={state.clusterConfig.name}
          onSubnetCreated={handleSubnetCreated}
        />
      )}
    </>
  );
}
