import React from "react";
import { cn } from "../../design-system/utils";

export type BadgeVariant =
  | "default"
  | "brand"
  | "cyan"
  | "critical"
  | "warning"
  | "success"
  | "info"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1 font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
  };

  const variantStyles = {
    default: "bg-surface-2 text-text-secondary border border-border-normal",
    brand: "bg-brand-orange/15 text-brand-amber border border-brand-orange/30",
    cyan: "bg-intelligence-cyan/15 text-intelligence-cyan border border-intelligence-cyan/30",
    critical: "bg-status-critical/15 text-status-critical border border-status-critical/30",
    warning: "bg-status-warning/15 text-status-warning border border-status-warning/30",
    success: "bg-status-success/15 text-status-success border border-status-success/30",
    info: "bg-status-info/15 text-status-info border border-status-info/30",
    outline: "bg-transparent text-text-secondary border border-border-normal",
  };

  const dotColors = {
    default: "bg-text-secondary",
    brand: "bg-brand-orange",
    cyan: "bg-intelligence-cyan",
    critical: "bg-status-critical animate-pulse",
    warning: "bg-status-warning",
    success: "bg-status-success",
    info: "bg-status-info",
    outline: "bg-text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm font-mono uppercase tracking-wider select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};

