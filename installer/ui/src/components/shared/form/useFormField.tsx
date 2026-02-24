import { ReactNode } from "react";
import { Label } from "../../ui/label";

export interface UseFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  error?: string;
  labelAction?: ReactNode;
}

export interface UseFormFieldReturn {
  /**
   * Render the label with optional required indicator
   */
  renderLabel: () => ReactNode;
  
  /**
   * Render help text or error message
   */
  renderFooter: () => ReactNode;
  
  /**
   * Whether the field has an error
   */
  hasError: boolean;
  
  /**
   * CSS classes for error state
   */
  getInputClassName: (baseClassName?: string) => string;
  
  /**
   * Props to spread on the wrapper div
   */
  wrapperProps: {
    className: string;
  };
}

/**
 * Custom hook for common form field functionality
 * Provides label, help text, error handling, and styling utilities
 */
export function useFormField(props: UseFormFieldProps): UseFormFieldReturn {
  const { id, label, required, disabled, helpText, error, labelAction } = props;
  const hasError = !!error;

  const renderLabel = () => (
    <div className="flex items-center justify-between">
      <Label
        htmlFor={id}
        className={disabled ? "cursor-not-allowed opacity-70" : ""}
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {labelAction}
    </div>
  );

  const renderFooter = () => {
    if (hasError) {
      return <p className="text-xs text-red-500">{error}</p>;
    }
    if (helpText) {
      return <p className="text-xs text-zinc-500">{helpText}</p>;
    }
    return null;
  };

  const getInputClassName = (baseClassName = "") => {
    const errorClasses = hasError ? "border-red-500 focus-visible:ring-red-500" : "";
    return `${baseClassName} ${errorClasses}`.trim();
  };

  return {
    renderLabel,
    renderFooter,
    hasError,
    getInputClassName,
    wrapperProps: {
      className: "space-y-2",
    },
  };
}

