import React from "react";
import { Card } from "./Card";
import { cn } from "../../design-system/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accent?: "none" | "orange" | "cyan" | "critical" | "warning";
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  trend,
  accent = "none",
  className,
}) => {
  const accentStyles = {
    none: "border-border-subtle",
    orange: "border-l-4 border-l-brand-orange border-border-subtle",
    cyan: "border-l-4 border-l-intelligence-cyan border-border-subtle",
    critical: "border-l-4 border-l-status-critical border-border-subtle",
    warning: "border-l-4 border-l-status-warning border-border-subtle",
  };

  return (
    <Card className={cn("p-5 flex flex-col justify-between", accentStyles[accent], className)}>
      <div className="flex items-center justify-between gap-2 text-text-secondary">
        <span className="text-xs uppercase font-mono tracking-wider font-semibold">{label}</span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>

      <div className="my-3 flex items-baseline gap-3">
        <span className="text-3xl font-display font-bold text-text-primary tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium font-mono gap-0.5",
              trend.isPositive ? "text-status-success" : "text-status-critical"
            )}
          >
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
        )}
      </div>

      {sublabel && <p className="text-xs text-text-muted">{sublabel}</p>}
    </Card>
  );
};

