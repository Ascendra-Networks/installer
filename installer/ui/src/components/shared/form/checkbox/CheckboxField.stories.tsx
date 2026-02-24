import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CheckboxField } from "./CheckboxField";

const meta: Meta<typeof CheckboxField> = {
  title: "Shared/Form/CheckboxField",
  component: CheckboxField,
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
type Story = StoryObj<typeof CheckboxField>;

export const Default: Story = {
  args: {
    id: "terms",
    label: "Accept terms and conditions",
    checked: false,
    onChange: () => {},
  },
};

export const Checked: Story = {
  args: {
    id: "generate-key",
    label: "Generate new SSH key pair",
    checked: true,
    onChange: () => {},
  },
};

export const Required: Story = {
  args: {
    id: "agree",
    label: "I agree to the license agreement",
    checked: false,
    onChange: () => {},
    required: true,
  },
};

export const WithHelpText: Story = {
  args: {
    id: "generate-key",
    label: "Generate new SSH key pair",
    checked: false,
    onChange: () => {},
    helpText: "A new RSA-4096 key pair will be generated and stored securely",
  },
};

export const WithError: Story = {
  args: {
    id: "agree",
    label: "I agree to the license agreement",
    checked: false,
    onChange: () => {},
    error: "You must accept the license agreement to continue",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "locked",
    label: "This option is locked",
    checked: true,
    onChange: () => {},
    disabled: true,
  },
};

function InteractiveCheckboxField() {
  const [checked, setChecked] = useState(false);

  return (
    <CheckboxField
      id="interactive"
      label="Generate new SSH key pair"
      checked={checked}
      onChange={setChecked}
      helpText="A new RSA-4096 key pair will be generated"
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveCheckboxField />,
};

