import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { ClusterSettings } from "./ClusterSettings";
import { WizardProvider } from "../../../../contexts/WizardContext";
import { awsService } from "../../../../services/aws.service";

const meta: Meta<typeof ClusterSettings> = {
  title: "Steps/Step2/AWSCloudConfiguration/ClusterSettings",
  component: ClusterSettings,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ClusterSettings>;

// Mock data generators
const generateMockRegions = () => {
  return [
    { value: "us-east-1", label: "US East (N. Virginia) - us-east-1" },
    { value: "us-east-2", label: "US East (Ohio) - us-east-2" },
    { value: "us-west-1", label: "US West (N. California) - us-west-1" },
    { value: "us-west-2", label: "US West (Oregon) - us-west-2" },
    { value: "eu-west-1", label: "Europe (Ireland) - eu-west-1" },
    { value: "eu-west-2", label: "Europe (London) - eu-west-2" },
    { value: "eu-central-1", label: "Europe (Frankfurt) - eu-central-1" },
    { value: "ap-south-1", label: "Asia Pacific (Mumbai) - ap-south-1" },
    { value: "ap-northeast-1", label: "Asia Pacific (Tokyo) - ap-northeast-1" },
    { value: "ap-southeast-1", label: "Asia Pacific (Singapore) - ap-southeast-1" },
  ];
};

const generateMockVPCs = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    value: `vpc-${String(i + 1).padStart(8, "0")}`,
    label: `vpc-${String(i + 1).padStart(8, "0")} (10.${i}.0.0/16) - ${
      i % 3 === 0 ? "Production" : i % 3 === 1 ? "Staging" : "Development"
    }`,
  }));
};

const generateMockSubnets = () => {
  return Array.from({ length: 15 }, (_, i) => ({
    value: `subnet-${String(i + 1).padStart(8, "0")}`,
    label: `subnet-${String(i + 1).padStart(8, "0")} (10.0.${i}.0/24) - ${
      i % 2 === 0 ? "Public" : "Private"
    } Subnet`,
  }));
};

function ClusterSettingsWithMock({ mockData }: { mockData?: boolean }) {
  useEffect(() => {
    if (!mockData) return;

    const originalGetRegions = awsService.getRegions.bind(awsService);
    const originalGetVPCs = awsService.getVPCs.bind(awsService);
    const originalGetSubnets = awsService.getSubnets.bind(awsService);

    awsService.getRegions = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockRegions();
    };

    awsService.getVPCs = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockVPCs();
    };

    awsService.getSubnets = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockSubnets();
    };

    return () => {
      awsService.getRegions = originalGetRegions;
      awsService.getVPCs = originalGetVPCs;
      awsService.getSubnets = originalGetSubnets;
    };
  }, [mockData]);

  return <ClusterSettings />;
}

export const Default: Story = {
  decorators: [
    (Story) => {
      const initialState = {
        cloudProvider: "aws" as const,
        clusterConfig: {
          name: "",
          region: "",
          vpc: "",
          subnet: "",
          nodePools: [],
        },
      };

      return (
        <WizardProvider initialState={initialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6 max-w-4xl">
            <ClusterSettingsWithMock mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};

export const WithPrefilledData: Story = {
  decorators: [
    (Story) => {
      const initialState = {
        cloudProvider: "aws" as const,
        clusterConfig: {
          name: "production-cluster",
          region: "us-east-1",
          vpc: "vpc-00000001",
          subnet: "subnet-00000001",
          nodePools: [],
        },
      };

      return (
        <WizardProvider initialState={initialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6 max-w-4xl">
            <ClusterSettingsWithMock mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};

export const SearchDemo: Story = {
  decorators: [
    (Story) => {
      const initialState = {
        cloudProvider: "aws" as const,
        clusterConfig: {
          name: "search-demo",
          region: "",
          vpc: "",
          subnet: "",
          nodePools: [],
        },
      };

      return (
        <WizardProvider initialState={initialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6 max-w-4xl">
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
              <p className="font-medium mb-1">Test the search functionality:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Region: Try searching "Europe", "Asia", or "Frankfurt"</li>
                <li>VPC: Search by ID or type ("Production", "Staging")</li>
                <li>Subnet: Search by ID or type ("Public", "Private")</li>
              </ul>
            </div>
            <ClusterSettingsWithMock mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};
