import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { EnvVariable } from '../../types';
import { Plus, Trash2, Eye, EyeOff, Variable } from 'lucide-react';

const ENV_KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface EnvVariablesEditorProps {
  envVars: EnvVariable[];
  onChange: (vars: EnvVariable[]) => void;
  title?: string;
  compact?: boolean;
}

export function EnvVariablesEditor({
  envVars,
  onChange,
  title = 'Environment Variables',
  compact = false,
}: EnvVariablesEditorProps) {
  const [revealedSecrets, setRevealedSecrets] = useState<Set<number>>(new Set());

  const addVariable = () => {
    onChange([...envVars, { key: '', value: '', isSecret: false }]);
  };

  const updateVariable = (index: number, updates: Partial<EnvVariable>) => {
    const updated = envVars.map((v, i) => (i === index ? { ...v, ...updates } : v));
    onChange(updated);
  };

  const removeVariable = (index: number) => {
    setRevealedSecrets((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    onChange(envVars.filter((_, i) => i !== index));
  };

  const toggleReveal = (index: number) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getKeyError = (key: string, index: number): string | null => {
    if (!key) return null;
    if (!ENV_KEY_REGEX.test(key)) {
      return 'Must start with a letter or underscore, and contain only letters, digits, or underscores';
    }
    const duplicate = envVars.findIndex((v, i) => i !== index && v.key === key);
    if (duplicate !== -1) {
      return 'Duplicate key';
    }
    return null;
  };

  const padding = compact ? 'p-3' : 'p-4';
  const gap = compact ? 'space-y-2' : 'space-y-3';

  return (
    <div className={`rounded-lg bg-zinc-800/30 ${padding} border border-zinc-800/50 ${gap}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-amber-400"></div>
          {title}
          {envVars.length > 0 && (
            <span className="text-xs text-zinc-500 font-normal">
              ({envVars.length})
            </span>
          )}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariable}
          className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
        >
          <Plus className="size-3" />
          Add Variable
        </Button>
      </div>

      {envVars.length === 0 ? (
        <div className={`${compact ? 'py-4' : 'py-6'} flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700/50 bg-zinc-900/30 text-center`}>
          <Variable className="size-5 text-zinc-600 mb-2" />
          <p className="text-sm text-zinc-400 font-medium">No environment variables</p>
          <p className="text-xs text-zinc-600 mt-1">
            Add variables like HTTP_PROXY, NO_PROXY, etc.
          </p>
        </div>
      ) : (
        <div className={`${gap} ${compact ? 'max-h-[200px]' : 'max-h-[280px]'} overflow-y-auto pr-1 custom-scrollbar`}>
          {envVars.map((envVar, index) => {
            const keyError = getKeyError(envVar.key, index);
            return (
              <div
                key={index}
                className="flex items-start gap-2 rounded-lg bg-gradient-to-r from-zinc-800/80 to-zinc-800/60 p-3 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors group"
              >
                <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/20 text-xs font-semibold text-amber-400 mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-[1fr_1fr] gap-2 min-w-0">
                  <div>
                    <Input
                      value={envVar.key}
                      onChange={(e) => updateVariable(index, { key: e.target.value })}
                      placeholder="KEY_NAME"
                      className={`bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500 font-mono text-sm ${
                        keyError ? 'border-red-500/50 focus:border-red-500' : ''
                      }`}
                    />
                    {keyError && (
                      <p className="text-[10px] text-red-400 mt-0.5 leading-tight">{keyError}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type={envVar.isSecret && !revealedSecrets.has(index) ? 'password' : 'text'}
                      value={envVar.value}
                      onChange={(e) => updateVariable(index, { value: e.target.value })}
                      placeholder="value"
                      className="bg-zinc-900/50 border-zinc-700/50 placeholder:text-zinc-500 text-sm pr-8"
                    />
                    {envVar.isSecret && (
                      <button
                        type="button"
                        onClick={() => toggleReveal(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {revealedSecrets.has(index) ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 px-1">
                    <Checkbox
                      id={`secret-${index}`}
                      checked={envVar.isSecret || false}
                      onCheckedChange={(checked: boolean) =>
                        updateVariable(index, { isSecret: checked })
                      }
                      className="size-3.5"
                    />
                    <Label
                      htmlFor={`secret-${index}`}
                      className="text-[11px] text-zinc-500 cursor-pointer select-none whitespace-nowrap"
                    >
                      Secret
                    </Label>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariable(index)}
                    className="size-7 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
