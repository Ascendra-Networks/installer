import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { AWSCloudConfiguration } from "./AWSCloudConfiguration";
import { withWizardProvider } from "../../decorators";
import { WizardProvider } from "../../../../contexts/WizardContext";
import { awsService } from "../../../../services/aws.service";
import { NodePool } from "../../../../types";

const meta: Meta<typeof AWSCloudConfiguration> = {
  title: "Steps/Step2/AWSCloudConfiguration/AWS Cloud Configuration",
  component: AWSCloudConfiguration,
  tags: ["autodocs"],
  decorators: [withWizardProvider],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AWSCloudConfiguration>;

// Generate many node pools for testing
const generateManyNodePools = (count: number): NodePool[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `pool-${i + 1}`,
    name: `Node Pool ${i + 1}`,
    machines: [
      { id: `m-${i}-1`, machineType: "t3.medium", nodeCount: 2 },
      { id: `m-${i}-2`, machineType: "t3.large", nodeCount: 1 },
    ],
    storageClass: "gp3",
    storageSize: 100 + i * 10,
  }));
};

// Mock data generators
const generateMockRegions = () => {
  return [
    { value: "us-east-1", label: "US East (N. Virginia) - us-east-1" },
    { value: "us-east-2", label: "US East (Ohio) - us-east-2" },
    { value: "us-west-1", label: "US West (N. California) - us-west-1" },
    { value: "us-west-2", label: "US West (Oregon) - us-west-2" },
    { value: "eu-west-1", label: "Europe (Ireland) - eu-west-1" },
    { value: "eu-west-2", label: "Europe (London) - eu-west-2" },
    { value: "eu-west-3", label: "Europe (Paris) - eu-west-3" },
    { value: "eu-central-1", label: "Europe (Frankfurt) - eu-central-1" },
    { value: "eu-central-2", label: "Europe (Zurich) - eu-central-2" },
    { value: "eu-north-1", label: "Europe (Stockholm) - eu-north-1" },
    { value: "ap-south-1", label: "Asia Pacific (Mumbai) - ap-south-1" },
    { value: "ap-northeast-1", label: "Asia Pacific (Tokyo) - ap-northeast-1" },
    { value: "ap-northeast-2", label: "Asia Pacific (Seoul) - ap-northeast-2" },
    { value: "ap-southeast-1", label: "Asia Pacific (Singapore) - ap-southeast-1" },
    { value: "ap-southeast-2", label: "Asia Pacific (Sydney) - ap-southeast-2" },
    { value: "ca-central-1", label: "Canada (Central) - ca-central-1" },
    { value: "sa-east-1", label: "South America (São Paulo) - sa-east-1" },
    { value: "me-south-1", label: "Middle East (Bahrain) - me-south-1" },
    { value: "af-south-1", label: "Africa (Cape Town) - af-south-1" },
  ];
};

const generateMockVPCs = (count: number = 25) => {
  return Array.from({ length: count }, (_, i) => ({
    value: `vpc-${String(i + 1).padStart(8, "0")}abcdef`,
    label: `vpc-${String(i + 1).padStart(8, "0")}abcdef (10.${i}.0.0/16) - ${
      i % 3 === 0 ? "Production" : i % 3 === 1 ? "Staging" : "Development"
    } Network ${i + 1}`,
  }));
};

const generateMockSubnets = (count: number = 50) => {
  const azs = ["a", "b", "c", "d", "e", "f"];
  return Array.from({ length: count }, (_, i) => ({
    value: `subnet-${String(i + 1).padStart(8, "0")}xyz`,
    label: `subnet-${String(i + 1).padStart(8, "0")}xyz (10.0.${i}.0/24) - AZ: us-east-1${
      azs[i % azs.length]
    } - ${i % 2 === 0 ? "Public" : "Private"} Subnet ${i + 1}`,
  }));
};

const generateMockMachineTypes = () => {
  return [
    { value: "t3.micro", label: "t3.micro", specs: "2 vCPU, 1 GB RAM" },
    { value: "t3.small", label: "t3.small", specs: "2 vCPU, 2 GB RAM" },
    { value: "t3.medium", label: "t3.medium", specs: "2 vCPU, 4 GB RAM" },
    { value: "t3.large", label: "t3.large", specs: "2 vCPU, 8 GB RAM" },
    { value: "t3.xlarge", label: "t3.xlarge", specs: "4 vCPU, 16 GB RAM" },
    { value: "t3.2xlarge", label: "t3.2xlarge", specs: "8 vCPU, 32 GB RAM" },
    { value: "m5.large", label: "m5.large", specs: "2 vCPU, 8 GB RAM" },
    { value: "m5.xlarge", label: "m5.xlarge", specs: "4 vCPU, 16 GB RAM" },
    { value: "m5.2xlarge", label: "m5.2xlarge", specs: "8 vCPU, 32 GB RAM" },
    { value: "m5.4xlarge", label: "m5.4xlarge", specs: "16 vCPU, 64 GB RAM" },
    { value: "c5.large", label: "c5.large", specs: "2 vCPU, 4 GB RAM (Compute)" },
    { value: "c5.xlarge", label: "c5.xlarge", specs: "4 vCPU, 8 GB RAM (Compute)" },
    { value: "c5.2xlarge", label: "c5.2xlarge", specs: "8 vCPU, 16 GB RAM (Compute)" },
    { value: "r5.large", label: "r5.large", specs: "2 vCPU, 16 GB RAM (Memory)" },
    { value: "r5.xlarge", label: "r5.xlarge", specs: "4 vCPU, 32 GB RAM (Memory)" },
    { value: "r5.2xlarge", label: "r5.2xlarge", specs: "8 vCPU, 64 GB RAM (Memory)" },
  ];
};

// Component wrapper that mocks API responses
function AWSCloudConfigWithMockData({ mockData }: { mockData?: boolean }) {
  useEffect(() => {
    if (!mockData) return;

    const originalGetRegions = awsService.getRegions.bind(awsService);
    const originalGetVPCs = awsService.getVPCs.bind(awsService);
    const originalGetSubnets = awsService.getSubnets.bind(awsService);
    const originalGetMachineTypes = awsService.getMachineTypes.bind(awsService);

    // Mock the API methods
    awsService.getRegions = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockRegions();
    };

    awsService.getVPCs = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockVPCs(25);
    };

    awsService.getSubnets = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockSubnets(50);
    };

    awsService.getMachineTypes = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockMachineTypes();
    };

    // Cleanup
    return () => {
      awsService.getRegions = originalGetRegions;
      awsService.getVPCs = originalGetVPCs;
      awsService.getSubnets = originalGetSubnets;
      awsService.getMachineTypes = originalGetMachineTypes;
    };
  }, [mockData]);

  return <AWSCloudConfiguration />;
}

export const Default: Story = {
  decorators: [
    (Story) => {
      const customInitialState = {
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
        <WizardProvider initialState={customInitialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6">
            <AWSCloudConfigWithMockData mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};

export const WithSearchDemo: Story = {
  decorators: [
    (Story) => {
      const customInitialState = {
        cloudProvider: "aws" as const,
        clusterConfig: {
          name: "search-demo-cluster",
          region: "",
          vpc: "",
          subnet: "",
          nodePools: [],
        },
      };

      return (
        <WizardProvider initialState={customInitialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6">
            <div className="space-y-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Search Functionality Demo</h2>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-300">
                <p className="font-medium mb-2">Testing the Search:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    <strong>Region:</strong> Try searching for "Europe", "Asia", "Frankfurt", "Tokyo"
                  </li>
                  <li>
                    <strong>VPC:</strong> Search by VPC ID or network type ("Production", "Staging")
                  </li>
                  <li>
                    <strong>Subnet:</strong> Search by subnet ID, CIDR, AZ, or type ("Public", "Private")
                  </li>
                  <li>
                    <strong>Machine Types:</strong> Search by instance type, vCPU, or memory size
                  </li>
                </ul>
              </div>
            </div>
            <AWSCloudConfigWithMockData mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};

export const WithManyNodePools: Story = {
  decorators: [
    (Story) => {
      const customInitialState = {
        cloudProvider: "aws" as const,
        clusterConfig: {
          name: "production-cluster",
          region: "us-east-1",
          vpc: "vpc-00000001abcdef",
          subnet: "subnet-00000001xyz",
          nodePools: generateManyNodePools(15),
        },
      };

      return (
        <WizardProvider initialState={customInitialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6">
            <AWSCloudConfigWithMockData mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};

export const PreConfigured: Story = {
  decorators: [
    (Story) => {
      const customInitialState = {
        cloudProvider: "aws" as const,
        clusterConfig: {
          name: "my-production-cluster",
          region: "eu-west-1",
          vpc: "vpc-00000005abcdef",
          subnet: "subnet-00000010xyz",
          nodePools: generateManyNodePools(3),
        },
      };

      return (
        <WizardProvider initialState={customInitialState}>
          <div className="dark min-h-screen bg-zinc-950 text-white p-6">
            <AWSCloudConfigWithMockData mockData={true} />
          </div>
        </WizardProvider>
      );
    },
  ],
};
