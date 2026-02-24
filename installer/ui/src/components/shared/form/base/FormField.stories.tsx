import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "Shared/Form/FormField",
  component: FormField,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number"],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    id: "name",
    label: "Name",
    placeholder: "Enter your name",
    value: "",
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    id: "cluster-name",
    label: "Cluster Name",
    placeholder: "my-cluster",
    value: "production-cluster",
    onChange: () => {},
  },
};

export const Required: Story = {
  args: {
    id: "email",
    label: "Email Address",
    placeholder: "user@example.com",
    value: "",
    onChange: () => {},
    required: true,
    type: "email",
  },
};

export const WithHelpText: Story = {
  args: {
    id: "cidr",
    label: "CIDR Block",
    placeholder: "10.0.0.0/16",
    value: "10.0.0.0/16",
    onChange: () => {},
    helpText: "Default: 10.0.0.0/16 (65,536 IPs)",
  },
};

export const WithError: Story = {
  args: {
    id: "cluster-name",
    label: "Cluster Name",
    placeholder: "my-cluster",
    value: "MY_INVALID_NAME",
    onChange: () => {},
    error: "Only lowercase letters, numbers, and hyphens are allowed",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "locked",
    label: "Locked Field",
    placeholder: "Cannot edit",
    value: "Read-only value",
    onChange: () => {},
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    id: "password",
    label: "Password",
    placeholder: "Enter password",
    value: "",
    onChange: () => {},
    type: "password",
    required: true,
  },
};

function InteractiveFormField() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleChange = (val: string) => {
    setValue(val);
    if (val && !/^[a-z0-9-]+$/.test(val)) {
      setError("Only lowercase letters, numbers, and hyphens allowed");
    } else {
      setError(undefined);
    }
  };

  return (
    <FormField
      id="interactive"
      label="Cluster Name"
      placeholder="my-cluster"
      value={value}
      onChange={handleChange}
      error={error}
      required
      helpText="Lowercase letters, numbers, and hyphens only"
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveFormField />,
};

