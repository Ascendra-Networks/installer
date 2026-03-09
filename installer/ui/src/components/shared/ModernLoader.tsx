import { Loader2 } from "lucide-react";

interface ModernLoaderProps {
  message?: string;
}

export function ModernLoader({ message = "Loading..." }: ModernLoaderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
      <div className="flex size-16 items-center justify-center rounded-full bg-blue-500/10">
        <Loader2 className="size-8 animate-spin text-blue-400" />
      </div>
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}
