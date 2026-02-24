import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { ReactNode, useState } from "react";
import { useFormField } from "../useFormField";
import { Search } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  helpText?: string;
  error?: string;
  customTrigger?: ReactNode;
  labelAction?: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  alignOffset?: number;
  maxHeight?: string;
  iconDirection?: "down" | "right";
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function SelectField({
  id,
  label,
  placeholder = "Select an option",
  value,
  onChange,
  options,
  disabled,
  required,
  loading,
  helpText,
  error,
  customTrigger,
  labelAction,
  align = "center",
  side,
  sideOffset,
  alignOffset,
  maxHeight,
  iconDirection = "down",
  searchable = false,
  searchPlaceholder = "Search...",
}: SelectFieldProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isDisabled = disabled || loading;
  
  const { renderLabel, renderFooter, getInputClassName, wrapperProps } = useFormField({
    id,
    label,
    required,
    disabled: isDisabled,
    helpText,
    error,
    labelAction,
  });

  const filteredOptions = searchable && searchTerm
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div {...wrapperProps}>
      {renderLabel()}
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={isDisabled}
        onOpenChange={(open) => {
          if (!open) {
            setSearchTerm(""); // Reset search when closing
          }
        }}
      >
        <SelectTrigger id={id} className={getInputClassName()} iconDirection={iconDirection}>
          {customTrigger || <SelectValue placeholder={placeholder} />}
        </SelectTrigger>
        <SelectContent 
          align={align} 
          side={side} 
          sideOffset={sideOffset} 
          alignOffset={alignOffset}
          style={maxHeight ? { maxHeight } : undefined}
        >
          {searchable && (
            <div className="sticky top-0 z-10 bg-zinc-900 p-2 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {renderFooter()}
    </div>
  );
}
