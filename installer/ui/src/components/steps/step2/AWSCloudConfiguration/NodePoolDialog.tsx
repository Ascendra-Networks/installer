import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { SearchableSelect } from "../../../shared/form";
import { EnvVariablesEditor } from "../../../shared/EnvVariablesEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../ui/dialog";
import { NodePool, MachineConfig, MachineTypeOption, EnvVariable } from "../../../../types";

interface NodePoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pool: NodePool) => void;
  machineTypes: MachineTypeOption[];
  editPool?: NodePool;
}

export function NodePoolDialog({
  open,
  onOpenChange,
  onSave,
  machineTypes,
  editPool,
}: NodePoolDialogProps) {
  const [pool, setPool] = useState<NodePool>(
    editPool || {
      id: `pool-${Date.now()}`,
      name: "",
      machines: [],
      storageClass: "standard",
      storageSize: 100,
    }
  );

  const addMachine = () => {
    const newMachine: MachineConfig = {
      id: `machine-${Date.now()}`,
      machineType: "",
      nodeCount: 1,
    };
    setPool({ ...pool, machines: [...pool.machines, newMachine] });
  };

  const updateMachine = (id: string, updates: Partial<MachineConfig>) => {
    setPool({
      ...pool,
      machines: pool.machines.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  };

  const removeMachine = (id: string) => {
    setPool({
      ...pool,
      machines: pool.machines.filter((m) => m.id !== id),
    });
  };

  const handleSave = () => {
    if (pool.name && pool.machines.length > 0) {
      const poolToSave = {
        ...pool,
        envVars: (pool.envVars || []).filter(v => v.key.trim() !== '')
      };
      onSave(poolToSave);
      onOpenChange(false);
      // Reset for next use
      setPool({
        id: `pool-${Date.now()}`,
        name: "",
        machines: [],
        storageClass: "standard",
        storageSize: 100,
        envVars: [],
      });
    }
  };

  const getTotalNodes = () => {
    return pool.machines.reduce((sum, m) => sum + m.nodeCount, 0);
  };

  const isValid = pool.name.trim() !== "" && pool.machines.length > 0 && 
                  pool.machines.every(m => m.machineType !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-h-[850px] max-h-[850px] flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/95 border-zinc-700/50 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/50 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
              <Plus className="size-5 text-white" />
            </div>
            {editPool ? "Edit Node Pool" : "New Node Pool"}
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Configure machine types and storage for your node pool
          </p>
        </DialogHeader>

        <div className="space-y-6 py-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Pool Name */}
          <div className="space-y-2">
            <Label htmlFor="pool-name" className="text-sm font-medium text-zinc-200">
              Pool Name
            </Label>
            <Input
              id="pool-name"
              placeholder="e.g., Production Pool"
              value={pool.name}
              onChange={(e) => setPool({ ...pool, name: e.target.value })}
              className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-zinc-500"
            />
          </div>

          {/* Machine Types */}
          <div className="space-y-3 rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 flex-shrink-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-blue-400"></div>
                Machine Types
              </Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addMachine}
                className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50"
              >
                <Plus className="size-3" />
                Add Machine Type
              </Button>
            </div>

            {pool.machines.length === 0 ? (
              <div className="h-[240px] min-h-[240px] max-h-[240px] flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-700/50 bg-zinc-900/30 p-8 text-center">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-full bg-zinc-800/50 mb-3">
                    <Plus className="size-5 text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">
                    No machine types configured
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Add at least one machine type to continue
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 h-[240px] min-h-[240px] max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {pool.machines.map((machine, index) => (
                  <div
                    key={machine.id}
                    className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-zinc-800/80 to-zinc-800/60 p-3 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors group"
                  >
                    <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/20 text-xs font-semibold text-blue-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid gap-3 md:grid-cols-2">
                      <SearchableSelect
                        value={machine.machineType}
                        onValueChange={(value) =>
                          updateMachine(machine.id, { machineType: value })
                        }
                        placeholder="Select machine type"
                        searchPlaceholder="Search machine types..."
                        triggerClassName="bg-zinc-900/50 border-zinc-700/50 data-[placeholder]:text-zinc-400"
                      >
                        {machineTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.label}</span>
                              <span className="text-xs text-zinc-500">
                                ({type.specs})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SearchableSelect>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={machine.nodeCount}
                          onChange={(e) =>
                            updateMachine(machine.id, {
                              nodeCount: parseInt(e.target.value) || 1,
                            })
                          }
                          placeholder="Count"
                          className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
                        />
                        <span className="text-xs text-zinc-400 whitespace-nowrap font-medium">
                          nodes
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMachine(machine.id)}
                      className="text-zinc-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage Settings */}
          <div className="rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 space-y-4">
            <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400"></div>
              Storage Configuration
            </Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storage-class" className="text-xs text-zinc-400">
                  Storage Class
                </Label>
                <SearchableSelect
                  value={pool.storageClass}
                  onValueChange={(value: any) =>
                    setPool({ ...pool, storageClass: value })
                  }
                  placeholder="Select storage class"
                  searchPlaceholder="Search storage classes..."
                  triggerClassName="bg-zinc-900/50 border-zinc-700/50 data-[placeholder]:text-zinc-400"
                >
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-zinc-400"></div>
                      <span>Standard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fast-ssd">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-orange-400"></div>
                      <span>Fast SSD</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-blue-400"></div>
                      <span>Balanced</span>
                    </div>
                  </SelectItem>
                </SearchableSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage-size" className="text-xs text-zinc-400">
                  Storage Size (GB)
                </Label>
                <Input
                  id="storage-size"
                  type="number"
                  min="10"
                  max="10000"
                  value={pool.storageSize}
                  onChange={(e) =>
                    setPool({
                      ...pool,
                      storageSize: parseInt(e.target.value) || 100,
                    })
                  }
                  className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <EnvVariablesEditor
            envVars={pool.envVars || []}
            onChange={(envVars: EnvVariable[]) => setPool({ ...pool, envVars })}
            title="Pool Environment Variables"
            compact
          />
        </div>

        <DialogFooter className="border-t border-zinc-800/50 pt-6 gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:from-zinc-700 disabled:to-zinc-700 disabled:shadow-none min-w-32"
          >
            {editPool ? "Save Changes" : "Create Pool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
