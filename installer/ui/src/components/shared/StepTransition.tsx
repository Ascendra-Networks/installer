import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../ui/utils";

interface StepTransitionProps {
  children: ReactNode;
  stepKey: number;
}

export function StepTransition({ children, stepKey }: StepTransitionProps) {
  const [showLoader, setShowLoader] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [currentKey, setCurrentKey] = useState(stepKey);
  const [savedChildren, setSavedChildren] = useState(children);

  useEffect(() => {
    if (stepKey !== currentKey) {
      // Phase 1: Fade out content
      setIsVisible(false);
      
      setTimeout(() => {
        // Phase 2: Show loader and fade it in
        setShowLoader(true);
        setTimeout(() => setIsVisible(true), 50);
        
        setTimeout(() => {
          // Phase 3: Fade out loader
          setIsVisible(false);
          
          setTimeout(() => {
            // Phase 4: Switch to new content and fade in
            setCurrentKey(stepKey);
            setSavedChildren(children);
            setShowLoader(false);
            setTimeout(() => setIsVisible(true), 50);
          }, 500);
        }, 2000);
      }, 500);
    }
  }, [stepKey, currentKey, children]);

  if (showLoader) {
    return (
      <div 
        className={cn(
          "flex min-h-[500px] items-center justify-center transition-opacity duration-500 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 animate-spin-slow">
              <div className="h-16 w-16 rounded-full border-2 border-transparent border-t-blue-400 border-r-blue-400"></div>
            </div>

            {/* Inner rotating ring - opposite direction */}
            <div className="absolute inset-2 animate-spin-reverse">
              <div className="h-12 w-12 rounded-full border-2 border-transparent border-b-blue-500 border-l-blue-500"></div>
            </div>

            {/* Center icon */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-blue-400" />
            </div>
          </div>

          <p className="text-sm font-medium text-zinc-400">
            Loading next step...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "transition-opacity duration-500 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {savedChildren}
    </div>
  );
}
