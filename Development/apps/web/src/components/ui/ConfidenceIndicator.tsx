import React from "react";
import { cn } from "../../design-system/utils";
import { ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

export interface ConfidenceIndicatorProps {
  score: number; // 0.000 to 1.000 or 0 to 100
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  showIcon = true,
  size = "md",
  className,
}) => {
  const normalizedScore = score > 1 ? score / 100 : score;
  const percentage = Math.round(normalizedScore * 100);

  let variant: "high" | "medium" | "low" = "low";
  if (percentage >= 80) variant = "high";
  else if (percentage >= 60) variant = "medium";

  const colorStyles = {
    high: {
      text: "text-status-success",
      bg: "bg-status-success/15",
      border: "border-status-success/30",
      bar: "bg-status-success",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />,
    },
    medium: {
      text: "text-status-warning",
      bg: "bg-status-warning/15",
      border: "border-status-warning/30",
      bar: "bg-status-warning",
      icon: <Sparkles className="w-3.5 h-3.5 text-status-warning shrink-0" />,
    },
    low: {
      text: "text-status-critical",
      bg: "bg-status-critical/15",
      border: "border-status-critical/30",
      bar: "bg-status-critical",
      icon: <ShieldAlert className="w-3.5 h-3.5 text-status-critical shrink-0" />,
    },
  };

  const config = colorStyles[variant];

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2",
    lg: "text-sm px-3 py-1.5 gap-2.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border font-mono font-semibold select-none",
        config.bg,
        config.border,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && config.icon}
      <span className={config.text}>{percentage}%</span>
      <div className="w-8 h-1.5 bg-surface-3 rounded-full overflow-hidden shrink-0">
        <div className={cn("h-full rounded-full", config.bar)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

