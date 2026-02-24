import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SearchableSelectField } from "./SearchableSelectField";
import { LoadingIndicator } from "../../loading/LoadingIndicator";
import { Button } from "../../../ui/button";
import { Sparkles } from "lucide-react";

const meta: Meta<typeof SearchableSelectField> = {
  title: "Shared/Form/SearchableSelectField",
  component: SearchableSelectField,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-md p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchableSelectField>;

// Generate many regions for search testing
const generateRegions = () => {
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
    { value: "eu-south-1", label: "Europe (Milan) - eu-south-1" },
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

// Generate many VPCs for search testing
const generateVPCs = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    value: `vpc-${String(i + 1).padStart(8, "0")}`,
    label: `vpc-${String(i + 1).padStart(8, "0")} (10.${i}.0.0/16) - ${
      i % 3 === 0 ? "Production" : i % 3 === 1 ? "Staging" : "Development"
    }`,
  }));
};

// Generate many machine types for search testing
const generateMachineTypes = () => {
  return [
    { value: "t3.micro", label: "t3.micro - 2 vCPU, 1 GB RAM" },
    { value: "t3.small", label: "t3.small - 2 vCPU, 2 GB RAM" },
    { value: "t3.medium", label: "t3.medium - 2 vCPU, 4 GB RAM" },
    { value: "t3.large", label: "t3.large - 2 vCPU, 8 GB RAM" },
    { value: "t3.xlarge", label: "t3.xlarge - 4 vCPU, 16 GB RAM" },
    { value: "t3.2xlarge", label: "t3.2xlarge - 8 vCPU, 32 GB RAM" },
    { value: "m5.large", label: "m5.large - 2 vCPU, 8 GB RAM" },
    { value: "m5.xlarge", label: "m5.xlarge - 4 vCPU, 16 GB RAM" },
    { value: "m5.2xlarge", label: "m5.2xlarge - 8 vCPU, 32 GB RAM" },
    { value: "m5.4xlarge", label: "m5.4xlarge - 16 vCPU, 64 GB RAM" },
    { value: "m5.8xlarge", label: "m5.8xlarge - 32 vCPU, 128 GB RAM" },
    { value: "c5.large", label: "c5.large - 2 vCPU, 4 GB RAM (Compute Optimized)" },
    { value: "c5.xlarge", label: "c5.xlarge - 4 vCPU, 8 GB RAM (Compute Optimized)" },
    { value: "c5.2xlarge", label: "c5.2xlarge - 8 vCPU, 16 GB RAM (Compute Optimized)" },
    { value: "c5.4xlarge", label: "c5.4xlarge - 16 vCPU, 32 GB RAM (Compute Optimized)" },
    { value: "r5.large", label: "r5.large - 2 vCPU, 16 GB RAM (Memory Optimized)" },
    { value: "r5.xlarge", label: "r5.xlarge - 4 vCPU, 32 GB RAM (Memory Optimized)" },
    { value: "r5.2xlarge", label: "r5.2xlarge - 8 vCPU, 64 GB RAM (Memory Optimized)" },
    { value: "r5.4xlarge", label: "r5.4xlarge - 16 vCPU, 128 GB RAM (Memory Optimized)" },
  ];
};

export const Default: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: generateRegions(),
    searchPlaceholder: "Search regions...",
  },
};

export const WithManyOptions: Story = {
  args: {
    id: "vpc",
    label: "VPC / Virtual Network",
    placeholder: "Select a VPC",
    value: "",
    onChange: () => {},
    options: generateVPCs(),
    searchPlaceholder: "Search VPCs...",
    helpText: "Search by VPC ID, CIDR, or environment type",
  },
};

export const MachineTypes: Story = {
  args: {
    id: "machine-type",
    label: "Machine Type",
    placeholder: "Select machine type",
    value: "",
    onChange: () => {},
    options: generateMachineTypes(),
    searchPlaceholder: "Search by type, vCPU, or RAM...",
    helpText: "Search by instance type, vCPU count, or memory size",
  },
};

export const WithValue: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "eu-west-1",
    onChange: () => {},
    options: generateRegions(),
    searchPlaceholder: "Search regions...",
  },
};

export const Required: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: generateRegions(),
    required: true,
    searchPlaceholder: "Search regions...",
  },
};

export const WithError: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: generateRegions(),
    error: "Region is required",
    required: true,
    searchPlaceholder: "Search regions...",
  },
};

export const Disabled: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select region first",
    value: "",
    onChange: () => {},
    options: [],
    disabled: true,
    searchPlaceholder: "Search regions...",
  },
};

export const Loading: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: [],
    loading: true,
    customTrigger: <LoadingIndicator text="Loading regions..." />,
    searchPlaceholder: "Search regions...",
  },
};

export const WithLabelAction: Story = {
  args: {
    id: "vpc",
    label: "VPC / Virtual Network",
    placeholder: "Select a VPC",
    value: "",
    onChange: () => {},
    options: generateVPCs(),
    required: true,
    searchPlaceholder: "Search VPCs...",
    labelAction: (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto p-1 text-xs text-blue-400 hover:text-blue-300"
      >
        <Sparkles className="size-3 mr-1" />
        Create New
      </Button>
    ),
  },
};

function InteractiveSearchableSelectField() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-4">
      <SearchableSelectField
        id="interactive-region"
        label="Region"
        placeholder="Select a region"
        value={value}
        onChange={setValue}
        options={generateRegions()}
        required
        searchPlaceholder="Search regions..."
        helpText={
          value
            ? `Selected: ${generateRegions().find((r) => r.value === value)?.label}`
            : "Try searching for 'Europe', 'Asia', or a specific region code"
        }
      />
      {value && (
        <Button onClick={() => setValue("")} variant="outline" size="sm">
          Clear Selection
        </Button>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveSearchableSelectField />,
};
