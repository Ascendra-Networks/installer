import { Input } from "../../../ui/input";
import { useFormField } from "../useFormField";

interface FormFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
  error?: string;
  type?: "text" | "password" | "email" | "number";
}

export function FormField({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  required,
  helpText,
  error,
  type = "text",
}: FormFieldProps) {
  const { renderLabel, renderFooter, getInputClassName, wrapperProps } = useFormField({
    id,
    label,
    required,
    disabled,
    helpText,
    error,
  });

  return (
    <div {...wrapperProps}>
      {renderLabel()}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={getInputClassName()}
      />
      {renderFooter()}
    </div>
  );
}
