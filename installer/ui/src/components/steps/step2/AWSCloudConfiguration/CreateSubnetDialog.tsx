import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { FormField, SelectField } from "../../../shared/form";
import { DialogActions } from "../../../shared/DialogActions";

// Default Subnet configuration - loaded from shared config
// Fallback values if API call fails
let SUBNET_DEFAULTS = {
  cidr: "10.0.1.0/24",
  nameSuffix: "-subnet"
};

// Load defaults from API on module load
fetch(`${import.meta.env.VITE_API_URL}/api/defaults/network`)
  .then((res) => res.json())
  .then((data) => {
    SUBNET_DEFAULTS = {
      cidr: data.subnet.cidr,
      nameSuffix: data.subnet.nameSuffix
    };
    console.log('[CreateSubnetDialog] Loaded subnet defaults from API:', SUBNET_DEFAULTS);
  })
  .catch((err) => {
    console.warn('[CreateSubnetDialog] Failed to load defaults from API, using fallback:', err);
  });

interface CreateSubnetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: string;
  vpcId: string;
  cloudProvider: string;
  clusterName?: string;
  onSubnetCreated: (subnetId: string) => void;
}

export function CreateSubnetDialog({
  open,
  onOpenChange,
  region,
  vpcId,
  cloudProvider,
  clusterName = "",
  onSubnetCreated,
}: CreateSubnetDialogProps) {
  const [name, setName] = useState("");
  const [cidr, setCidr] = useState(SUBNET_DEFAULTS.cidr);
  const [availabilityZone, setAvailabilityZone] = useState("");
  const [availabilityZones, setAvailabilityZones] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [loadingAzs, setLoadingAzs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate name based on cluster name when dialog opens
  useEffect(() => {
    if (open && clusterName) {
      setName(`${clusterName}${SUBNET_DEFAULTS.nameSuffix}`);
    }
  }, [open, clusterName]);

  // Fetch availability zones when dialog opens
  useEffect(() => {
    if (open && region && cloudProvider === 'aws') {
      setLoadingAzs(true);
      fetch(`${import.meta.env.VITE_API_URL}/api/aws/availability-zone/list?region=${encodeURIComponent(region)}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailabilityZones(data);
          // Auto-select first AZ, which matches Terraform's behavior (uses {region}a)
          if (data.length > 0) {
            // Prefer {region}a if available
            const preferredAz = data.find((az: any) => az.value.endsWith('a'));
            setAvailabilityZone(preferredAz ? preferredAz.value : data[0].value);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch AZs:", err);
          // Fallback to example with 20 AZs for demo/story purposes
          const exampleAzs = Array.from({ length: 20 }, (_, i) => {
            const letter = String.fromCharCode(97 + i); // a-t
            return {
              value: `${region}${letter}`,
              label: `${region}${letter} - Availability Zone ${letter.toUpperCase()}`
            };
          });
          setAvailabilityZones(exampleAzs);
          setAvailabilityZone(`${region}a`);
        })
        .finally(() => setLoadingAzs(false));
    }
  }, [open, region, cloudProvider]);

  const handleCreate = async () => {
    if (!name || !cidr || !availabilityZone) {
      setError("All fields are required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/aws/subnet/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region,
            vpcId,
            name,
            cidr,
            availabilityZone,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subnet");
      }

      const data = await response.json();
      onSubnetCreated(data.subnetId);
      onOpenChange(false);
      
      // Reset form
      setName("");
      setCidr("10.0.1.0/24");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subnet");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-blue-400" />
            Create New Subnet
          </DialogTitle>
          <DialogDescription>
            Create a new subnet in VPC {vpcId} with Terraform-aligned defaults
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-blue-500/10 p-3 text-sm text-blue-400">
            <p className="font-medium">Standard Configuration</p>
            <p className="mt-1 text-xs text-zinc-400">
              Using Ascendra naming convention and default CIDR ranges
            </p>
          </div>

          <FormField
            id="subnet-name"
            label="Subnet Name"
            placeholder={`${clusterName || 'my-cluster'}${SUBNET_DEFAULTS.nameSuffix}`}
            value={name}
            onChange={setName}
            disabled={creating}
            helpText={`Convention: {cluster-name}${SUBNET_DEFAULTS.nameSuffix}`}
          />

          <FormField
            id="subnet-cidr"
            label="CIDR Block"
            placeholder={SUBNET_DEFAULTS.cidr}
            value={cidr}
            onChange={setCidr}
            disabled={creating}
            helpText={`Default: ${SUBNET_DEFAULTS.cidr} (256 IPs) - must be within VPC CIDR range`}
          />

          <SelectField
            id="subnet-az"
            label="Availability Zone"
            placeholder="Select availability zone"
            value={availabilityZone}
            onChange={setAvailabilityZone}
            options={availabilityZones}
            disabled={creating}
            loading={loadingAzs}
            helpText={`Terraform default: ${region}a`}
            side="right"
            sideOffset={8}
            align="start"
            alignOffset={-60}
            maxHeight="400px"
            iconDirection="right"
            searchable={true}
            searchPlaceholder="Search availability zones..."
            customTrigger={
              loadingAzs ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading AZs...</span>
                </div>
              ) : undefined
            }
          />

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <DialogActions
          onCancel={() => onOpenChange(false)}
          onConfirm={handleCreate}
          confirmText="Create Subnet"
          confirmIcon={Sparkles}
          isLoading={creating}
          loadingText="Creating..."
          disabled={loadingAzs}
        />
      </DialogContent>
    </Dialog>
  );
}
