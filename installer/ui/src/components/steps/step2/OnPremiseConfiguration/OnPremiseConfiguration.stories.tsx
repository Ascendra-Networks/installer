import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { OnPremiseConfiguration } from "./OnPremiseConfiguration";
import { OnPremiseConfig } from "../../../../types";

const meta: Meta<typeof OnPremiseConfiguration> = {
  title: "Steps/Step2/OnPremiseConfiguration/On-Premise Configuration",
  component: OnPremiseConfiguration,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-zinc-950 text-white p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OnPremiseConfiguration>;

export const Default: Story = {
  args: {
    onConfigChange: (config) => console.log("Config changed:", config),
  },
};

export const WithInitialConfig: Story = {
  args: {
    onConfigChange: (config) => console.log("Config changed:", config),
    initialConfig: {
      clusterName: "onprem-cluster",
      controlPlane: {
        sshConfig: {
          user: "ubuntu",
          password: "example-password",
        },
        nodes: [
          { ip: "10.0.1.10", hostname: "master-1" },
          { ip: "10.0.1.11", hostname: "master-2" },
          { ip: "10.0.1.12", hostname: "master-3" },
        ],
      },
      workerNodes: [
        {
          groupName: "compute-group",
          sshConfig: {
            user: "ubuntu",
            password: "example-password",
          },
          labels: { role: "compute" },
          taints: [],
          nodes: [
            { ip: "10.0.2.20", hostname: "worker-1" },
            { ip: "10.0.2.21", hostname: "worker-2" },
          ],
        },
        {
          groupName: "gpu-group",
          sshConfig: {
            user: "ubuntu",
            password: "example-password",
          },
          labels: { role: "gpu", "nvidia.com/gpu": "true" },
          taints: [],
          nodes: [
            { ip: "10.0.3.30", hostname: "gpu-worker-1" },
          ],
        },
      ],
    },
  },
};

function InteractiveOnPremise() {
  const [config, setConfig] = useState<OnPremiseConfig | undefined>();

  return (
    <div className="space-y-4">
      <OnPremiseConfiguration
        onConfigChange={setConfig}
      />
      {config && (
        <pre className="mt-4 rounded bg-zinc-900 p-4 text-xs text-zinc-400 max-h-64 overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveOnPremise />,
};

