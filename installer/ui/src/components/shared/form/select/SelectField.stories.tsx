import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SelectField } from "./SelectField";
import { LoadingIndicator } from "../../loading/LoadingIndicator";
import { Button } from "../../../ui/button";
import { Sparkles } from "lucide-react";

const meta: Meta<typeof SelectField> = {
  title: "Shared/Form/SelectField",
  component: SelectField,
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
type Story = StoryObj<typeof SelectField>;

const regionOptions = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
];

export const Default: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: regionOptions,
  },
};

export const WithValue: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "us-east-1",
    onChange: () => {},
    options: regionOptions,
  },
};

export const Required: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: regionOptions,
    required: true,
  },
};

export const WithHelpText: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: regionOptions,
    helpText: "Choose the region closest to your users",
  },
};

export const WithError: Story = {
  args: {
    id: "region",
    label: "Region",
    placeholder: "Select a region",
    value: "",
    onChange: () => {},
    options: regionOptions,
    error: "Region is required",
    required: true,
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
  },
};

export const WithLabelAction: Story = {
  args: {
    id: "vpc",
    label: "VPC / Virtual Network",
    placeholder: "Select a VPC",
    value: "",
    onChange: () => {},
    options: [
      { value: "vpc-001", label: "vpc-production (10.0.0.0/16)" },
      { value: "vpc-002", label: "vpc-staging (10.1.0.0/16)" },
    ],
    required: true,
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

function InteractiveSelectField() {
  const [value, setValue] = useState("");

  return (
    <SelectField
      id="interactive-region"
      label="Region"
      placeholder="Select a region"
      value={value}
      onChange={setValue}
      options={regionOptions}
      required
      helpText="Choose the region closest to your users"
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveSelectField />,
};

