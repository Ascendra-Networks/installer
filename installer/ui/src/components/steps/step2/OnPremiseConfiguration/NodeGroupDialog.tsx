import { useState, useEffect } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../ui/dialog';
import { EnvVariablesEditor } from '../../../shared/EnvVariablesEditor';
import { NodeCustomizeDialog } from './NodeCustomizeDialog';
import { OnPremiseNodeGroup, OnPremiseNode, OnPremiseSSHConfig, EnvVariable, OsType } from '../../../../types';
import { Plus, Trash2, Settings } from 'lucide-react';

interface NodeGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: OnPremiseNodeGroup;
  onSave: (group: OnPremiseNodeGroup) => void;
  title?: string;
  description?: string;
}

export function NodeGroupDialog({
  open,
  onOpenChange,
  group,
  onSave,
  title = "Node Pool",
  description = "Configure node pool with multiple nodes"
}: NodeGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [sshUser, setSSHUser] = useState('ubuntu');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nodes, setNodes] = useState<OnPremiseNode[]>([{ ip: '', hostname: '', osType: 'ubuntu' }]);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [customizeNodeIndex, setCustomizeNodeIndex] = useState<number | null>(null);

  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setSSHUser(group.sshConfig?.user || 'ubuntu');
      setPassword(group.sshConfig?.password || '');
      setNodes(group.nodes.length > 0 ? group.nodes.map(n => ({ ...n, osType: n.osType || 'ubuntu' })) : [{ ip: '', hostname: '', osType: 'ubuntu' }]);
      setEnvVars(group.envVars ? [...group.envVars] : []);
    } else {
      setGroupName('');
      setSSHUser('ubuntu');
      setPassword('');
      setNodes([{ ip: '', hostname: '', osType: 'ubuntu' }]);
      setEnvVars([]);
    }
  }, [group, open]);

  const addNode = () => {
    setNodes([...nodes, { ip: '', hostname: '', osType: 'ubuntu' }]);
  };

  const removeNode = (index: number) => {
    if (nodes.length > 1) {
      setNodes(nodes.filter((_, i) => i !== index));
    }
  };

  const updateNode = (index: number, field: keyof OnPremiseNode, value: string) => {
    const newNodes = [...nodes];
    newNodes[index] = { ...newNodes[index], [field]: value };
    setNodes(newNodes);
  };

  const saveCustomizedNode = (updatedNode: OnPremiseNode) => {
    if (customizeNodeIndex === null) return;
    const newNodes = [...nodes];
    newNodes[customizeNodeIndex] = updatedNode;
    setNodes(newNodes);
    setCustomizeNodeIndex(null);
  };

  const handleSave = () => {
    const newGroup: OnPremiseNodeGroup = {
      groupName,
      sshConfig: {
        user: sshUser,
        password
      },
      labels: group?.labels || {},
      taints: group?.taints || [],
      nodes: nodes.filter(n => n.ip.trim() !== ''),
      envVars: envVars.filter(v => v.key.trim() !== '')
    };
    onSave(newGroup);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-h-[850px] max-h-[850px] flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/95 border-zinc-700/50 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/50 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
              <Plus className="size-5 text-white" />
            </div>
            {title}
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            {description}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Pool Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium text-zinc-200">
              Pool Name
            </Label>
            <Input
              id="groupName"
              placeholder="e.g., compute-pool, storage-pool"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-zinc-500"
            />
          </div>

          {/* SSH Credentials */}
          <div className="rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 space-y-4">
            <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400"></div>
              SSH Credentials
            </Label>
            
            <div className="space-y-2">
              <Label htmlFor="sshUser" className="text-xs text-zinc-400">
                Username
              </Label>
              <Input
                id="sshUser"
                value={sshUser}
                onChange={(e) => setSSHUser(e.target.value)}
                placeholder="ubuntu"
                className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sshPassword" className="text-xs text-zinc-400">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="sshPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter SSH password"
                  className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {/* Nodes List */}
          <div className="space-y-3 rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 flex-shrink-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-blue-400"></div>
                Worker Nodes
              </Label>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={addNode}
                className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50"
              >
                <Plus className="size-3" />
                Add Node
              </Button>
            </div>

            {nodes.length === 0 ? (
              <div className="h-[210px] min-h-[210px] max-h-[210px] flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-700/50 bg-zinc-900/30 p-8 text-center">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-full bg-zinc-800/50 mb-3">
                    <Plus className="size-5 text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">
                    No nodes configured
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Add at least one node to continue
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 h-[210px] min-h-[210px] max-h-[210px] overflow-y-auto pr-1 custom-scrollbar">
                {nodes.map((node, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-zinc-800/80 to-zinc-800/60 p-3 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors group"
                  >
                    <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/20 text-xs font-semibold text-blue-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        value={node.ip}
                        onChange={(e) => updateNode(index, 'ip', e.target.value)}
                        placeholder="IP Address (e.g., 192.168.1.20)"
                        className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
                      />
                      <Input
                        value={node.hostname || ''}
                        onChange={(e) => updateNode(index, 'hostname', e.target.value)}
                        placeholder="Hostname (optional)"
                        className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOs: OsType = node.osType === 'suse' ? 'ubuntu' : 'suse';
                          const newNodes = [...nodes];
                          newNodes[index] = { ...newNodes[index], osType: newOs };
                          setNodes(newNodes);
                        }}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          node.osType === 'suse'
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                        }`}
                        title="Click to toggle OS type"
                      >
                        {node.osType === 'suse' ? 'SUSE' : 'Ubuntu'}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCustomizeNodeIndex(index)}
                      className="text-zinc-500 hover:text-white hover:bg-zinc-800 shrink-0"
                      title="Customize this node (password, env vars)"
                    >
                      <Settings className="size-4" />
                    </Button>
                    {nodes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNode(index)}
                        className="text-zinc-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environment Variables */}
          <EnvVariablesEditor
            envVars={envVars}
            onChange={setEnvVars}
            title="Pool Environment Variables"
            compact
          />
        </div>

        {customizeNodeIndex !== null && nodes[customizeNodeIndex] && (
          <NodeCustomizeDialog
            open={customizeNodeIndex !== null}
            onOpenChange={(open) => !open && setCustomizeNodeIndex(null)}
            node={nodes[customizeNodeIndex]}
            defaultSshUser={sshUser}
            onSave={saveCustomizedNode}
          />
        )}

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
            disabled={!groupName.trim() || nodes.filter(n => n.ip.trim()).length === 0}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:from-zinc-700 disabled:to-zinc-700 disabled:shadow-none min-w-32"
          >
            Create Pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ControlPlaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: OnPremiseNode;
  sshConfig?: OnPremiseSSHConfig;
  onSave: (node: OnPremiseNode, sshConfig: OnPremiseSSHConfig) => void;
  isEditing?: boolean;
}

export function ControlPlaneDialog({
  open,
  onOpenChange,
  node: initialNode,
  sshConfig: initialSSHConfig,
  onSave,
  isEditing = false
}: ControlPlaneDialogProps) {
  const [ip, setIp] = useState('');
  const [hostname, setHostname] = useState('');
  const [osType, setOsType] = useState<OsType>('ubuntu');
  const [sshUser, setSSHUser] = useState('ubuntu');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialNode) {
      setIp(initialNode.ip || '');
      setHostname(initialNode.hostname || '');
      setOsType(initialNode.osType || 'ubuntu');
    } else {
      setIp('');
      setHostname('');
      setOsType('ubuntu');
    }
    
    if (initialSSHConfig) {
      setSSHUser(initialSSHConfig.user);
      setPassword(initialSSHConfig.password || '');
    } else {
      setSSHUser('ubuntu');
      setPassword('');
    }
  }, [initialNode, initialSSHConfig, open]);

  const handleSave = () => {
    if (ip.trim()) {
      const sshConfig: OnPremiseSSHConfig = {
        user: sshUser,
        password
      };
      onSave({ ip: ip.trim(), hostname: hostname.trim() || undefined, osType }, sshConfig);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/95 border-zinc-700/50 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/50 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
              <Plus className="size-5 text-white" />
            </div>
            {isEditing ? 'Edit Control Plane Node' : 'Add Control Plane Node'}
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            {isEditing ? 'Update master node details' : 'Add a new master node for cluster management'}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Node Details */}
          <div className="rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 space-y-4">
            <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-blue-400"></div>
              Node Details
            </Label>

            <div className="space-y-2">
              <Label htmlFor="cpNodeIp" className="text-xs text-zinc-400">
                IP Address
              </Label>
              <Input
                id="cpNodeIp"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g., 192.168.1.10"
                className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpNodeHostname" className="text-xs text-zinc-400">
                Hostname (optional)
              </Label>
              <Input
                id="cpNodeHostname"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="e.g., master-1"
                className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">
                Operating System
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOsType('ubuntu')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    osType === 'ubuntu'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-zinc-900/50 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300'
                  }`}
                >
                  Ubuntu / Debian
                </button>
                <button
                  type="button"
                  onClick={() => setOsType('suse')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    osType === 'suse'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'bg-zinc-900/50 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300'
                  }`}
                >
                  SUSE / SLES
                </button>
              </div>
            </div>
          </div>

          {/* SSH Credentials */}
          <div className="rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 space-y-4">
            <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400"></div>
              SSH Credentials
            </Label>

            <div className="space-y-2">
              <Label htmlFor="cpSshUser" className="text-xs text-zinc-400">
                Username
              </Label>
              <Input
                id="cpSshUser"
                value={sshUser}
                onChange={(e) => setSSHUser(e.target.value)}
                placeholder="ubuntu"
                className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpSshPassword" className="text-xs text-zinc-400">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="cpSshPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter SSH password"
                  className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
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
            disabled={!ip.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:from-zinc-700 disabled:to-zinc-700 disabled:shadow-none min-w-32"
          >
            {isEditing ? 'Save Changes' : 'Add Node'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
