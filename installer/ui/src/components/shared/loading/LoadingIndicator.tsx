import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

export function LoadingIndicator({
  text,
  size = "md",
}: LoadingIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span>{text}</span>}
    </div>
  );
}

