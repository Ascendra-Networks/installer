import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { NodePool } from "../../../../types";

interface ConfigurationSummaryProps {
  nodePools: NodePool[];
  region: string;
  clusterName: string;
}

/**
 * ConfigurationSummary Component
 * 
 * Displays a summary of the current AWS cluster configuration including
 * total node pools, total nodes, region, and cluster name.
 */
export function ConfigurationSummary({
  nodePools,
  region,
  clusterName,
}: ConfigurationSummaryProps) {
  const getTotalNodes = () => {
    return nodePools.reduce(
      (sum, pool) => sum + pool.machines.reduce((s, m) => s + m.nodeCount, 0),
      0
    );
  };

  if (nodePools.length === 0 && !region && !clusterName) {
    return null;
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="text-white">Configuration Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-zinc-500">Cluster Name</p>
            <p className="mt-1 font-medium text-white">
              {clusterName || "-"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Region</p>
            <p className="mt-1 font-medium text-white">
              {region || "-"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Total Node Pools</p>
            <p className="mt-1 font-medium text-white">
              {nodePools.length}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Total Nodes</p>
            <p className="mt-1 font-medium text-white">
              {getTotalNodes()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
