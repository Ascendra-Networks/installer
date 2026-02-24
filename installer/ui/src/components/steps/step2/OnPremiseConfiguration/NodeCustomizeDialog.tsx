import { useState, useEffect } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../ui/dialog';
import { EnvVariablesEditor } from '../../../shared/EnvVariablesEditor';
import { OnPremiseNode, EnvVariable } from '../../../../types';
import { Settings } from 'lucide-react';

interface NodeCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current node (may already have envVars / sshConfig overrides) */
  node: OnPremiseNode;
  /** Default SSH user from pool/control plane (for display / "use default" hint) */
  defaultSshUser?: string;
  onSave: (node: OnPremiseNode) => void;
}

/**
 * Dialog to customize a single node: optional SSH override (user, password) and
 * optional environment variables for this node only. Merged over pool/cluster in backend.
 */
export function NodeCustomizeDialog({
  open,
  onOpenChange,
  node,
  defaultSshUser = 'ubuntu',
  onSave,
}: NodeCustomizeDialogProps) {
  const [sshUser, setSshUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);

  useEffect(() => {
    if (open && node) {
      setSshUser(node.sshConfig?.user ?? '');
      setPassword(node.sshConfig?.password ?? '');
      setEnvVars(node.envVars ? [...node.envVars] : []);
    }
  }, [node, open]);

  const handleSave = () => {
    const envFiltered = envVars.filter((v) => v.key.trim() !== '');
    const useSshOverride = sshUser.trim() !== '' || password.trim() !== '';
    const nextNode: OnPremiseNode = {
      ...node,
      envVars: envFiltered.length > 0 ? envFiltered : undefined,
      sshConfig:
        useSshOverride
          ? {
              ...(sshUser.trim() && { user: sshUser.trim() }),
              ...(password.trim() && { password: password.trim() }),
            }
          : undefined,
    };
    if (!nextNode.sshConfig?.user && !nextNode.sshConfig?.password) {
      nextNode.sshConfig = undefined;
    }
    if (!nextNode.envVars?.length) {
      nextNode.envVars = undefined;
    }
    onSave(nextNode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/95 border-zinc-700/50 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/50 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-600 shadow-lg">
              <Settings className="size-5 text-white" />
            </div>
            Customize node
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Override SSH or environment variables for this node only. Leave empty to use pool/default.
          </p>
          {node.ip && (
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              {node.hostname ? `${node.hostname} (${node.ip})` : node.ip}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Override SSH for this node */}
          <div className="rounded-lg bg-zinc-800/30 p-4 border border-zinc-800/50 space-y-4">
            <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400"></div>
              Override SSH for this node
            </Label>
            <p className="text-xs text-zinc-500">
              Default: <span className="font-mono text-zinc-400">{defaultSshUser}</span>. Set below to use a different user or password for this node only.
            </p>
            <div className="space-y-2">
              <Label htmlFor="nodeCustomSshUser" className="text-xs text-zinc-400">
                Username (optional)
              </Label>
              <Input
                id="nodeCustomSshUser"
                value={sshUser}
                onChange={(e) => setSshUser(e.target.value)}
                placeholder={`e.g. ${defaultSshUser}`}
                className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nodeCustomPassword" className="text-xs text-zinc-400">
                Password (optional)
              </Label>
              <div className="relative">
                <Input
                  id="nodeCustomPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Node-specific SSH password"
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

          {/* Environment variables for this node */}
          <EnvVariablesEditor
            envVars={envVars}
            onChange={setEnvVars}
            title="Environment variables for this node"
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
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 min-w-32"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
