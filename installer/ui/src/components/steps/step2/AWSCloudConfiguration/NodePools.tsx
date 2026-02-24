import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { LoadingIndicator } from "../../../shared/loading/LoadingIndicator";
import { NodePool } from "../../../../types";

interface NodePoolsProps {
  nodePools: NodePool[];
  onAddPool: () => void;
  onEditPool: (pool: NodePool) => void;
  onRemovePool: (id: string) => void;
  loadingMachineTypes?: boolean;
  regionSelected?: boolean;
}

/**
 * NodePools Component
 * 
 * Displays a table of configured node pools with actions to add, edit, and remove pools.
 * Shows pool details including machine types, node counts, and storage configuration.
 */
export function NodePools({
  nodePools,
  onAddPool,
  onEditPool,
  onRemovePool,
  loadingMachineTypes = false,
  regionSelected = false,
}: NodePoolsProps) {
  const getTotalNodes = (pool: NodePool) => {
    return pool.machines.reduce((sum, m) => sum + m.nodeCount, 0);
  };

  const getMachineTypeSummary = (pool: NodePool) => {
    if (pool.machines.length === 0) return "-";
    return pool.machines
      .map((m) => `${m.nodeCount}x ${m.machineType}`)
      .join(", ");
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Node Pools</CardTitle>
        <Button
          onClick={onAddPool}
          size="sm"
          disabled={!regionSelected || loadingMachineTypes}
        >
          {loadingMachineTypes ? (
            <LoadingIndicator text="Loading..." />
          ) : (
            <>
              <Plus className="size-4" />
              Add Node Pool
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {nodePools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[240px] text-center">
            <p className="text-sm text-zinc-400">
              No node pools configured yet
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Click "Add Node Pool" to create your first pool
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-900 z-10">
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Machine Types
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Total Nodes
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Storage
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nodePools.map((pool) => (
                    <tr
                      key={pool.id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="font-medium text-white">{pool.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-300">
                          {getMachineTypeSummary(pool)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-blue-400">
                          {getTotalNodes(pool)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-400">
                          {pool.storageSize}GB ({pool.storageClass})
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditPool(pool)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemovePool(pool.id)}
                            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
