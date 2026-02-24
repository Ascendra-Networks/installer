import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { FormField } from "../../../shared/form";
import { DialogActions } from "../../../shared/DialogActions";

// Default VPC configuration - loaded from shared config
// Fallback values if API call fails
let VPC_DEFAULTS = {
  cidr: "10.0.0.0/16",
  nameSuffix: "-vpc"
};

// Load defaults from API on module load
fetch(`${import.meta.env.VITE_API_URL}/api/defaults/network`)
  .then((res) => res.json())
  .then((data) => {
    VPC_DEFAULTS = {
      cidr: data.vpc.cidr,
      nameSuffix: data.vpc.nameSuffix
    };
    console.log('[CreateVpcDialog] Loaded VPC defaults from API:', VPC_DEFAULTS);
  })
  .catch((err) => {
    console.warn('[CreateVpcDialog] Failed to load defaults from API, using fallback:', err);
  });

interface CreateVpcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: string;
  cloudProvider: string;
  clusterName?: string;
  onVpcCreated: (vpcId: string) => void;
}

export function CreateVpcDialog({
  open,
  onOpenChange,
  region,
  cloudProvider,
  clusterName = "",
  onVpcCreated,
}: CreateVpcDialogProps) {
  const [name, setName] = useState("");
  const [cidr, setCidr] = useState(VPC_DEFAULTS.cidr);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate name based on cluster name when dialog opens
  useEffect(() => {
    if (open && clusterName) {
      setName(`${clusterName}${VPC_DEFAULTS.nameSuffix}`);
    }
  }, [open, clusterName]);

  const handleCreate = async () => {
    if (!name || !cidr) {
      setError("Name and CIDR are required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/aws/vpc/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region,
            name,
            cidr,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create VPC");
      }

      const data = await response.json();
      onVpcCreated(data.vpcId);
      onOpenChange(false);
      
      // Reset form
      setName("");
      setCidr("10.0.0.0/16");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create VPC");
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
            Create New VPC
          </DialogTitle>
          <DialogDescription>
            Create a new Virtual Private Cloud in {region} with Terraform-aligned defaults
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
            id="vpc-name"
            label="VPC Name"
            placeholder={`${clusterName || 'my-cluster'}${VPC_DEFAULTS.nameSuffix}`}
            value={name}
            onChange={setName}
            disabled={creating}
            helpText={`Convention: {cluster-name}${VPC_DEFAULTS.nameSuffix}`}
          />

          <FormField
            id="vpc-cidr"
            label="CIDR Block"
            placeholder={VPC_DEFAULTS.cidr}
            value={cidr}
            onChange={setCidr}
            disabled={creating}
            helpText={`Default: ${VPC_DEFAULTS.cidr} (65,536 IPs) - matches Terraform configuration`}
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
          confirmText="Create VPC"
          confirmIcon={Sparkles}
          isLoading={creating}
          loadingText="Creating..."
        />
      </DialogContent>
    </Dialog>
  );
}
