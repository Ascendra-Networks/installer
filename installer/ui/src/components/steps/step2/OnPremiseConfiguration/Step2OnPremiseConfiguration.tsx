import React, { useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card';
import { Alert, AlertDescription } from '../../../ui/alert';
import { NodeGroupDialog, ControlPlaneDialog } from './NodeGroupDialog';
import { NodeCustomizeDialog } from './NodeCustomizeDialog';
import { EnvVariablesEditor } from '../../../shared/EnvVariablesEditor';
import { 
  OnPremiseConfig, 
  OnPremiseNode, 
  OnPremiseNodeGroup,
  OnPremiseValidationResult,
  SSHValidationResult,
  EnvVariable
} from '../../../../types';
import { Download, Upload, Plus, Trash2, CheckCircle, XCircle, Loader2, Edit2, Server, Settings } from 'lucide-react';

interface OnPremiseConfigurationProps {
  onConfigChange: (config: OnPremiseConfig) => void;
  initialConfig?: OnPremiseConfig;
}

/**
 * OnPremiseConfiguration Component
 * 
 * Main component for on-premise configuration in Step 2 of the wizard.
 * Manages cluster settings, control plane nodes, and worker node groups.
 */
export const OnPremiseConfiguration: React.FC<OnPremiseConfigurationProps> = ({ 
  onConfigChange, 
  initialConfig 
}) => {
  const [config, setConfig] = useState<OnPremiseConfig>(initialConfig || {
    clusterName: '',
    controlPlane: {
      sshConfig: {
        user: 'ubuntu',
        password: ''
      },
      nodes: []
    },
    workerNodes: []
  });

  const [validation, setValidation] = useState<OnPremiseValidationResult | null>(null);
  const [sshValidation, setSSHValidation] = useState<SSHValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTestingSSH, setIsTestingSSH] = useState(false);
  const [controlPlaneDialogOpen, setControlPlaneDialogOpen] = useState(false);
  const [editingControlPlaneIndex, setEditingControlPlaneIndex] = useState<number | null>(null);
  const [customizingControlPlaneIndex, setCustomizingControlPlaneIndex] = useState<number | null>(null);
  const [workerGroupDialogOpen, setWorkerGroupDialogOpen] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);

  const updateConfig = (newConfig: OnPremiseConfig) => {
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updateClusterName = (name: string) => {
    updateConfig({ ...config, clusterName: name });
  };

  const handleAddControlPlaneNode = () => {
    setEditingControlPlaneIndex(null);
    setControlPlaneDialogOpen(true);
  };

  const handleEditControlPlaneNode = (index: number) => {
    setEditingControlPlaneIndex(index);
    setControlPlaneDialogOpen(true);
  };

  const handleSaveControlPlaneNode = (node: OnPremiseNode, sshConfig: any) => {
    if (editingControlPlaneIndex !== null) {
      const newNodes = [...config.controlPlane.nodes];
      newNodes[editingControlPlaneIndex] = node;
      updateConfig({
        ...config,
        controlPlane: { ...config.controlPlane, nodes: newNodes, sshConfig }
      });
    } else {
      updateConfig({
        ...config,
        controlPlane: {
          ...config.controlPlane,
          nodes: [...config.controlPlane.nodes, node],
          sshConfig
        }
      });
    }
  };

  const handleRemoveControlPlaneNode = (index: number) => {
    const newNodes = config.controlPlane.nodes.filter((_, i) => i !== index);
    updateConfig({
      ...config,
      controlPlane: { ...config.controlPlane, nodes: newNodes }
    });
  };

  const handleSaveCustomizedControlPlaneNode = (node: OnPremiseNode) => {
    if (customizingControlPlaneIndex === null) return;
    const newNodes = [...config.controlPlane.nodes];
    newNodes[customizingControlPlaneIndex] = node;
    updateConfig({
      ...config,
      controlPlane: { ...config.controlPlane, nodes: newNodes }
    });
    setCustomizingControlPlaneIndex(null);
  };

  const handleAddWorkerGroup = () => {
    setEditingGroupIndex(null);
    setWorkerGroupDialogOpen(true);
  };

  const handleEditWorkerGroup = (index: number) => {
    setEditingGroupIndex(index);
    setWorkerGroupDialogOpen(true);
  };

  const handleSaveWorkerGroup = (group: OnPremiseNodeGroup) => {
    if (editingGroupIndex !== null) {
      // Edit existing group
      const newGroups = [...config.workerNodes];
      newGroups[editingGroupIndex] = group;
      updateConfig({
        ...config,
        workerNodes: newGroups
      });
    } else {
      // Add new group
      updateConfig({
        ...config,
        workerNodes: [...config.workerNodes, group]
      });
    }
  };

  const handleRemoveWorkerGroup = (index: number) => {
    const newGroups = config.workerNodes.filter((_, i) => i !== index);
    updateConfig({
      ...config,
      workerNodes: newGroups
    });
  };

  const validateConfig = async (configToValidate?: OnPremiseConfig, yaml?: string) => {
    setIsValidating(true);
    setValidation(null);

    try {
      const response = await fetch('/api/onpremise/validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: configToValidate,
          yaml
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
      }

      const result: OnPremiseValidationResult = await response.json();
      setValidation(result);

      if (result.valid && result.config) {
        updateConfig(result.config);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateManual = () => {
    validateConfig(config);
  };

  const testSSHConnections = async () => {
    setIsTestingSSH(true);
    setSSHValidation(null);

    try {
      const response = await fetch('/api/onpremise/validate-ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, timeout: 10 })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
      }

      const result: SSHValidationResult = await response.json();
      setSSHValidation(result);
    } catch (error) {
      console.error('SSH validation error:', error);
      setSSHValidation({
        success: false,
        tested: 0,
        passed: 0,
        failed: 0,
        nodes: [],
        error: `SSH test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingSSH(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/onpremise/config-template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'onpremise-cluster-template.yaml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      validateConfig(undefined, text);
      event.target.value = ''; // Reset input
    }
  };

  const getTotalNodes = () => {
    return config.controlPlane.nodes.length + 
           config.workerNodes.reduce((sum, group) => sum + group.nodes.length, 0);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">On-Premise Configuration</h2>
        <p className="mt-2 text-zinc-400">
          Configure your existing infrastructure by entering node details or uploading a YAML configuration
        </p>
      </div>

      {/* Upload Section */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Configuration
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </Button>
      </div>

      {/* Cluster Settings */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Cluster Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clusterName">Cluster Name</Label>
            <Input
              id="clusterName"
              value={config.clusterName}
              onChange={(e) => updateClusterName(e.target.value)}
              placeholder="my-onprem-cluster"
            />
            <p className="text-xs text-zinc-500">Lowercase letters, numbers, and hyphens only</p>
          </div>
        </CardContent>
      </Card>

      {/* Control Plane Nodes */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Control Plane Nodes</CardTitle>
            <CardDescription>Master nodes for cluster management</CardDescription>
          </div>
          <Button onClick={handleAddControlPlaneNode} size="sm">
            <Plus className="size-4" />
            Add Control Plane Node
          </Button>
        </CardHeader>
        <CardContent>
          {config.controlPlane.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[156px] text-center">
              <p className="text-sm text-zinc-400">
                No control plane nodes configured yet
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Click "Add Control Plane Node" to add master nodes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[200px] overflow-y-auto custom-scrollbar">
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead className="sticky top-0 bg-zinc-900 z-10">
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Hostname
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      SSH User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Auth
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {config.controlPlane.nodes.map((node, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors h-[52px]"
                    >
                      <td className="px-4 py-4">
                        <span className="font-medium text-white">{node.ip}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-300">
                          {node.hostname || `master-${index}`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-400">
                          {config.controlPlane.sshConfig.user}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-mono ${config.controlPlane.sshConfig.password ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {config.controlPlane.sshConfig.password ? 'Password set' : 'Not configured'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCustomizingControlPlaneIndex(index)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title="Customize this node (password, env vars)"
                          >
                            <Settings className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditControlPlaneNode(index)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveControlPlaneNode(index)}
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
          )}
        </CardContent>
      </Card>

      {/* Node Pools */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Node Pools</CardTitle>
            <CardDescription>Worker nodes organized by pools with labels and taints</CardDescription>
          </div>
          <Button onClick={handleAddWorkerGroup} size="sm">
            <Plus className="size-4" />
            New Node Pool
          </Button>
        </CardHeader>
        <CardContent>
          {config.workerNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[156px] text-center">
              <p className="text-sm text-zinc-400">
                No node pools configured yet
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Click "New Node Pool" to create your first pool
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[200px] overflow-y-auto custom-scrollbar">
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead className="sticky top-0 bg-zinc-900 z-10">
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Pool Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Nodes
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      SSH User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Labels
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {config.workerNodes.map((group, groupIndex) => (
                    <tr
                      key={groupIndex}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors h-[52px]"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-zinc-500" />
                          <span className="font-medium text-white">{group.groupName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-blue-400">
                          {group.nodes.length}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-400">
                          {group.sshConfig.user}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-400">
                          {group.labels && Object.keys(group.labels).length > 0
                            ? Object.keys(group.labels).length + ' label(s)'
                            : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWorkerGroup(groupIndex)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveWorkerGroup(groupIndex)}
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
          )}
        </CardContent>
      </Card>

      {/* Cluster Environment Variables */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-6">
          <EnvVariablesEditor
            envVars={config.envVars || []}
            onChange={(envVars: EnvVariable[]) => updateConfig({ ...config, envVars })}
            title="Cluster Environment Variables"
          />
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      {(config.controlPlane.nodes.length > 0 || config.workerNodes.length > 0) && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-zinc-500">Cluster Name</p>
                <p className="mt-1 font-medium text-white">
                  {config.clusterName || '-'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Control Plane Nodes</p>
                <p className="mt-1 font-medium text-white">
                  {config.controlPlane.nodes.length}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Total Node Pools</p>
                <p className="mt-1 font-medium text-white">
                  {config.workerNodes.length}
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
      )}

      {/* Validation & Testing */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Validation & Testing</CardTitle>
          <CardDescription>Validate configuration and test SSH connectivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleValidateManual} disabled={isValidating} className="flex-1">
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Configuration'
              )}
            </Button>

            {validation?.valid && (
              <Button 
                onClick={testSSHConnections} 
                disabled={isTestingSSH}
                variant="secondary"
                className="flex-1"
              >
                {isTestingSSH ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing SSH...
                  </>
                ) : (
                  'Test SSH Connections'
                )}
              </Button>
            )}
          </div>

          {validation && (
            <Alert variant={validation.valid ? 'default' : 'destructive'}>
              {validation.valid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {validation.valid ? 'Configuration is valid!' : validation.error}
              </AlertDescription>
            </Alert>
          )}

          {sshValidation && (
            <Alert variant={sshValidation.success ? 'default' : 'destructive'}>
              {sshValidation.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>SSH Test Results:</strong> {sshValidation.passed}/{sshValidation.tested} nodes accessible
                {sshValidation.failed > 0 && (
                  <div className="mt-2">
                    <strong>Failed nodes:</strong>
                    <ul className="list-disc list-inside">
                      {sshValidation.nodes
                        .filter(n => !n.success)
                        .map((n, i) => (
                          <li key={i}>{n.ip} - {n.error}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ControlPlaneDialog
        open={controlPlaneDialogOpen}
        onOpenChange={setControlPlaneDialogOpen}
        node={editingControlPlaneIndex !== null ? config.controlPlane.nodes[editingControlPlaneIndex] : undefined}
        sshConfig={config.controlPlane.sshConfig}
        onSave={handleSaveControlPlaneNode}
        isEditing={editingControlPlaneIndex !== null}
      />

      {customizingControlPlaneIndex !== null && config.controlPlane.nodes[customizingControlPlaneIndex] && (
        <NodeCustomizeDialog
          open={customizingControlPlaneIndex !== null}
          onOpenChange={(open) => !open && setCustomizingControlPlaneIndex(null)}
          node={config.controlPlane.nodes[customizingControlPlaneIndex]}
          defaultSshUser={config.controlPlane.sshConfig.user}
          onSave={handleSaveCustomizedControlPlaneNode}
        />
      )}
      
      <NodeGroupDialog
        open={workerGroupDialogOpen}
        onOpenChange={setWorkerGroupDialogOpen}
        group={editingGroupIndex !== null ? config.workerNodes[editingGroupIndex] : undefined}
        onSave={handleSaveWorkerGroup}
      />
    </div>
  );
};

