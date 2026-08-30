import React from "react";
import { cn } from "../../design-system/utils";

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  variant?: "brand" | "cyan" | "critical" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = "brand",
  size = "md",
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variantStyles = {
    brand: "bg-brand-orange",
    cyan: "bg-intelligence-cyan",
    critical: "bg-status-critical",
    success: "bg-status-success",
    warning: "bg-status-warning",
  };

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono text-text-secondary">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-surface-3 rounded-full overflow-hidden border border-border-subtle", sizeStyles[size])}>
        <div
          className={cn("h-full transition-all duration-300 rounded-full", variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

