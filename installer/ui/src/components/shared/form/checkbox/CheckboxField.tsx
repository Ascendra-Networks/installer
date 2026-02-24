import { Checkbox } from "../../../ui/checkbox";
import { Label } from "../../../ui/label";

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
  error?: string;
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
  required,
  helpText,
  error,
}: CheckboxFieldProps) {
  const hasError = !!error;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className={hasError ? "border-red-500" : ""}
        />
        <Label
          htmlFor={id}
          className={`text-sm font-medium leading-none ${
            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      </div>
      {helpText && !hasError && (
        <p className="text-xs text-zinc-500 ml-6">{helpText}</p>
      )}
      {hasError && (
        <p className="text-xs text-red-500 ml-6">{error}</p>
      )}
    </div>
  );
}
