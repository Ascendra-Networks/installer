import { Brain } from "lucide-react";

interface ModernLoaderProps {
  message?: string;
}

export function ModernLoader({ message = "Loading..." }: ModernLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Brain Icon */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="h-24 w-24 rounded-full border-2 border-transparent border-t-yellow-400 border-r-yellow-400"></div>
          </div>
          
          {/* Middle rotating ring - opposite direction */}
          <div className="absolute inset-2 animate-spin-reverse">
            <div className="h-20 w-20 rounded-full border-2 border-transparent border-b-blue-500 border-l-blue-500"></div>
          </div>
          
          {/* Inner smooth glow - no blinking */}
          <div className="absolute inset-4 animate-glow-smooth">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-blue-500/20"></div>
          </div>
          
          {/* Brain Icon - smooth glow instead of pulse */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            <Brain className="size-10 animate-glow-smooth text-yellow-400" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium text-white">{message}</p>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-yellow-400 [animation-delay:0ms]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-yellow-400 [animation-delay:150ms]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-yellow-400 [animation-delay:300ms]"></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full animate-progress bg-gradient-to-r from-yellow-400 to-blue-500"></div>
        </div>
      </div>
    </div>
  );
}
