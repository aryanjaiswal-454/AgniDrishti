import React from "react";
import { cn } from "../../design-system/utils";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Processing Intelligence Feed...",
  className,
}) => {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-lg border border-border-subtle bg-surface/30 my-4",
        className
      )}
    >
      <Loader2 className="w-8 h-8 animate-spin text-brand-orange mb-3" />
      <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">
        {label}
      </span>
    </div>
  );
};

