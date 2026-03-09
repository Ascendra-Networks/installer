import { useState, useEffect } from "react";
import { Shield, Globe, Lock, Ban } from "lucide-react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Checkbox } from "../../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../ui/dialog";
import { ProxyConfig, ProxyMode } from "../../../../types";

interface ProxyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proxyConfig?: ProxyConfig;
  onSave: (config: ProxyConfig) => void;
}

const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  enabled: false,
  mode: "grouped",
  HTTP_PROXY: "",
  http_proxy: "",
  HTTPS_PROXY: "",
  https_proxy: "",
  NO_PROXY: "",
  no_proxy: "",
};

const MODES: {
  value: ProxyMode;
  label: string;
  description: string;
}[] = [
  {
    value: "grouped",
    label: "Grouped",
    description: "One URL for all HTTP/HTTPS proxies",
  },
  {
    value: "protocol",
    label: "Per Protocol",
    description: "Separate HTTP and HTTPS URLs",
  },
  {
    value: "granular",
    label: "Granular",
    description: "Each env variable individually",
  },
];

export function ProxyConfigDialog({
  open,
  onOpenChange,
  proxyConfig,
  onSave,
}: ProxyConfigDialogProps) {
  const [config, setConfig] = useState<ProxyConfig>(
    proxyConfig ?? DEFAULT_PROXY_CONFIG
  );

  useEffect(() => {
    if (open) {
      setConfig(proxyConfig ?? DEFAULT_PROXY_CONFIG);
    }
  }, [open, proxyConfig]);

  const handleModeChange = (newMode: ProxyMode) => {
    setConfig((prev) => {
      const updated = { ...prev, mode: newMode };

      if (newMode === "grouped") {
        // Canonical: take HTTP_PROXY value and spread to all four
        const val = prev.HTTP_PROXY;
        return { ...updated, HTTP_PROXY: val, http_proxy: val, HTTPS_PROXY: val, https_proxy: val };
      }

      if (newMode === "protocol") {
        // From grouped: both http and https were the same, keep as-is
        // From granular: HTTP_PROXY → httpProxy group, HTTPS_PROXY → httpsProxy group
        return {
          ...updated,
          http_proxy: prev.HTTP_PROXY,
          https_proxy: prev.HTTPS_PROXY,
        };
      }

      // granular: values already stored individually, nothing to do
      return updated;
    });
  };

  const setGroupedProxy = (value: string) =>
    setConfig((c) => ({
      ...c,
      HTTP_PROXY: value,
      http_proxy: value,
      HTTPS_PROXY: value,
      https_proxy: value,
    }));

  const setHttpProxy = (value: string) =>
    setConfig((c) => ({ ...c, HTTP_PROXY: value, http_proxy: value }));

  const setHttpsProxy = (value: string) =>
    setConfig((c) => ({ ...c, HTTPS_PROXY: value, https_proxy: value }));

  const setNoProxy = (value: string) =>
    setConfig((c) => ({ ...c, NO_PROXY: value, no_proxy: value }));

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/95 border-zinc-700/50 shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/50 pb-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20">
              <Shield className="size-5 text-white" />
            </div>
            Proxy Configuration
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Configure proxy environment variables injected into all cluster nodes
          </p>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 border border-zinc-800/50 px-4 py-3">
            <div>
              <Label
                htmlFor="proxy-enabled"
                className="text-sm font-medium text-zinc-200 cursor-pointer"
              >
                Enable Proxy
              </Label>
              <p className="text-xs text-zinc-500 mt-0.5">
                Inject proxy environment variables into all cluster nodes
              </p>
            </div>
            <Checkbox
              id="proxy-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) =>
                setConfig((c) => ({ ...c, enabled: !!checked }))
              }
              className="size-5 border-zinc-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
            />
          </div>

          {config.enabled && (
            <>
              {/* Mode selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-violet-400" />
                  Configuration Mode
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleModeChange(m.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                        config.mode === m.value
                          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                          : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">{m.label}</div>
                      <div className="mt-0.5 text-[11px] leading-tight opacity-70">
                        {m.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                {config.mode === "grouped" && (
                  <>
                    <ProxyField
                      label="Proxy URL"
                      value={config.HTTP_PROXY}
                      onChange={setGroupedProxy}
                      placeholder="http://proxy.example.com:3128"
                      vars={["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"]}
                    />
                    <ProxyField
                      label="No Proxy"
                      value={config.NO_PROXY}
                      onChange={setNoProxy}
                      placeholder="localhost,127.0.0.1,.corp.example.com"
                      vars={["NO_PROXY", "no_proxy"]}
                      hint="Comma-separated list of hosts to bypass the proxy"
                    />
                  </>
                )}

                {config.mode === "protocol" && (
                  <>
                    <ProxyField
                      label="HTTP Proxy"
                      value={config.HTTP_PROXY}
                      onChange={setHttpProxy}
                      placeholder="http://proxy.example.com:3128"
                      vars={["HTTP_PROXY", "http_proxy"]}
                      icon={<Globe className="size-3.5 text-blue-400" />}
                    />
                    <ProxyField
                      label="HTTPS Proxy"
                      value={config.HTTPS_PROXY}
                      onChange={setHttpsProxy}
                      placeholder="http://proxy.example.com:3128"
                      vars={["HTTPS_PROXY", "https_proxy"]}
                      icon={<Lock className="size-3.5 text-emerald-400" />}
                    />
                    <ProxyField
                      label="No Proxy"
                      value={config.NO_PROXY}
                      onChange={setNoProxy}
                      placeholder="localhost,127.0.0.1,.corp.example.com"
                      vars={["NO_PROXY", "no_proxy"]}
                      hint="Comma-separated list of hosts to bypass the proxy"
                      icon={<Ban className="size-3.5 text-zinc-400" />}
                    />
                  </>
                )}

                {config.mode === "granular" && (
                  <>
                    <GranularGroup
                      title="HTTP Proxy"
                      color="blue"
                      icon={<Globe className="size-3.5" />}
                      fields={[
                        {
                          label: "HTTP_PROXY",
                          value: config.HTTP_PROXY,
                          onChange: (v) => setConfig((c) => ({ ...c, HTTP_PROXY: v })),
                        },
                        {
                          label: "http_proxy",
                          value: config.http_proxy,
                          onChange: (v) => setConfig((c) => ({ ...c, http_proxy: v })),
                        },
                      ]}
                      placeholder="http://proxy.example.com:3128"
                    />
                    <GranularGroup
                      title="HTTPS Proxy"
                      color="emerald"
                      icon={<Lock className="size-3.5" />}
                      fields={[
                        {
                          label: "HTTPS_PROXY",
                          value: config.HTTPS_PROXY,
                          onChange: (v) => setConfig((c) => ({ ...c, HTTPS_PROXY: v })),
                        },
                        {
                          label: "https_proxy",
                          value: config.https_proxy,
                          onChange: (v) => setConfig((c) => ({ ...c, https_proxy: v })),
                        },
                      ]}
                      placeholder="http://proxy.example.com:3128"
                    />
                    <GranularGroup
                      title="No Proxy"
                      color="zinc"
                      icon={<Ban className="size-3.5" />}
                      fields={[
                        {
                          label: "NO_PROXY",
                          value: config.NO_PROXY,
                          onChange: (v) => setConfig((c) => ({ ...c, NO_PROXY: v })),
                          hint: "Comma-separated list",
                        },
                        {
                          label: "no_proxy",
                          value: config.no_proxy,
                          onChange: (v) => setConfig((c) => ({ ...c, no_proxy: v })),
                          hint: "Comma-separated list",
                        },
                      ]}
                      placeholder="localhost,127.0.0.1,.corp.example.com"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-zinc-800/50 pt-6 gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg shadow-violet-500/20 min-w-32"
          >
            Save Proxy Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProxyFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  vars: string[];
  hint?: string;
  icon?: React.ReactNode;
}

function ProxyField({ label, value, onChange, placeholder, vars, hint, icon }: ProxyFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
          {icon}
          {label}
        </Label>
        <div className="flex gap-1 flex-wrap justify-end">
          {vars.map((v) => (
            <span
              key={v}
              className="text-[10px] font-mono border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded"
            >
              {v}
            </span>
          ))}
        </div>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500 focus:ring-violet-500/20 placeholder:text-zinc-600 font-mono text-sm"
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

interface GranularGroupProps {
  title: string;
  color: "blue" | "emerald" | "zinc";
  icon: React.ReactNode;
  fields: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
  }[];
  placeholder?: string;
}

const colorMap = {
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  zinc: "text-zinc-400",
};

function GranularGroup({ title, color, icon, fields, placeholder }: GranularGroupProps) {
  return (
    <div className="rounded-lg bg-zinc-800/30 border border-zinc-800/50 p-4 space-y-3">
      <Label
        className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${colorMap[color]}`}
      >
        {icon}
        {title}
      </Label>
      {fields.map((f) => (
        <div key={f.label} className="space-y-1.5">
          <Label className="text-xs font-mono text-zinc-300">{f.label}</Label>
          <Input
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-zinc-900/50 border-zinc-700/50 focus:border-violet-500/50 focus:ring-violet-500/10 placeholder:text-zinc-600 font-mono text-sm"
          />
          {f.hint && <p className="text-xs text-zinc-600">{f.hint}</p>}
        </div>
      ))}
    </div>
  );
}
