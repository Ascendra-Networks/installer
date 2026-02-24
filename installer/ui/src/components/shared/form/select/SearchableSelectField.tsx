"use client";

import * as React from "react";
import { ReactNode } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { useFormField } from "../useFormField";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  helpText?: string;
  error?: string;
  customTrigger?: ReactNode;
  labelAction?: ReactNode;
  searchPlaceholder?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  alignOffset?: number;
  maxHeight?: string;
  iconDirection?: "down" | "right";
}

/**
 * SearchableSelectField - A select field with built-in search functionality
 * 
 * Combines the SelectField features with search capabilities for long lists of options.
 * Ideal for regions, VPCs, subnets, machine types, etc.
 */
export function SearchableSelectField({
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
  searchPlaceholder = "Search...",
  align = "center",
  side,
  sideOffset,
  alignOffset,
  maxHeight,
  iconDirection = "down",
}: SearchableSelectFieldProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [open, setOpen] = React.useState(false);
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchTerm(""); // Reset search when closing
    }
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;

    const search = searchTerm.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(search) ||
        option.value.toLowerCase().includes(search)
    );
  }, [options, searchTerm]);

  return (
    <div {...wrapperProps}>
      {renderLabel()}
      <Select
        value={value}
        onValueChange={onChange}
        disabled={isDisabled}
        open={open}
        onOpenChange={handleOpenChange}
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
          {/* Search Input */}
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
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Results */}
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

/**
 * SearchableSelect - Raw searchable select component (without form field wrapper)
 * 
 * Use this when you need just the select functionality without label, help text, etc.
 * For form usage, prefer SearchableSelectField.
 */
export interface SearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  disabled,
  children,
  searchPlaceholder = "Search...",
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchTerm(""); // Reset search when closing
    }
  };

  // Filter children based on search term
  const filteredChildren = React.useMemo(() => {
    if (!searchTerm || !children) return children;

    return React.Children.toArray(children).filter((child) => {
      if (!React.isValidElement(child)) return true;

      // Handle SelectItem
      if (child.props?.value) {
        const value = String(child.props.value).toLowerCase();
        const childText = getChildText(child).toLowerCase();
        const search = searchTerm.toLowerCase();

        return value.includes(search) || childText.includes(search);
      }

      // Handle SelectGroup - filter its children recursively
      if (child.props?.children) {
        const groupChildren = React.Children.toArray(child.props.children);
        const filteredGroupChildren = groupChildren.filter((groupChild) => {
          if (!React.isValidElement(groupChild) || !groupChild.props?.value) return true;

          const value = String(groupChild.props.value).toLowerCase();
          const childText = getChildText(groupChild).toLowerCase();
          const search = searchTerm.toLowerCase();

          return value.includes(search) || childText.includes(search);
        });

        if (filteredGroupChildren.length === 0) return false;

        return React.cloneElement(child, {
          ...child.props,
          children: filteredGroupChildren,
        });
      }

      return true;
    });
  }, [children, searchTerm]);

  const hasResults = React.useMemo(() => {
    const items = React.Children.toArray(filteredChildren);
    return items.length > 0;
  }, [filteredChildren]);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
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
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {!hasResults ? (
          <div className="px-3 py-8 text-center text-sm text-zinc-500">
            No results found
          </div>
        ) : (
          filteredChildren
        )}
      </SelectContent>
    </Select>
  );
}

// Helper function to extract text content from React elements
function getChildText(child: React.ReactElement): string {
  if (typeof child.props.children === "string") {
    return child.props.children;
  }

  if (React.isValidElement(child.props.children)) {
    return getChildText(child.props.children);
  }

  if (Array.isArray(child.props.children)) {
    return child.props.children
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (React.isValidElement(c)) return getChildText(c);
        return "";
      })
      .join(" ");
  }

  return "";
}
