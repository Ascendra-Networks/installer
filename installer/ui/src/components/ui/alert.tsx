import * as React from "react";
import { cn } from "./utils";

interface AlertProps {
  variant?: "default" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant = "default", className, children }: AlertProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "default" && "border-blue-500/50 bg-blue-500/10 text-blue-200",
        variant === "destructive" && "border-red-500/50 bg-red-500/10 text-red-200",
        className
      )}
    >
      <div className="flex items-start gap-3">{children}</div>
    </div>
  );
}

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertDescription({ className, children }: AlertDescriptionProps) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)}>
      {children}
    </div>
  );
}

interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertTitle({ className, children }: AlertTitleProps) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)}>
      {children}
    </h5>
  );
}


