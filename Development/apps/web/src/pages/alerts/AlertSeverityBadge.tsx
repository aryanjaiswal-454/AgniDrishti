import React from "react";
import { AlertSeverity, AlertStatus } from "@agnidrishti/shared-types";
import { AlertTriangle, AlertCircle, Info, ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "../../design-system/utils";

export interface AlertSeverityBadgeProps {
  severity: AlertSeverity | string;
  size?: "sm" | "md";
  className?: string;
}

export const AlertSeverityBadge: React.FC<AlertSeverityBadgeProps> = ({
  severity,
  size = "md",
  className,
}) => {
  const isHigh = severity === "high";
  const isMedium = severity === "medium";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-mono uppercase tracking-wider select-none font-bold",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        isHigh && "bg-status-critical/15 text-status-critical border border-status-critical/40 shadow-sm",
        isMedium && "bg-status-warning/15 text-status-warning border border-status-warning/40",
        !isHigh && !isMedium && "bg-intelligence-cyan/15 text-intelligence-cyan border border-intelligence-cyan/30 font-medium",
        className
      )}
    >
      {isHigh && <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-ping" />}
      {isHigh && <AlertCircle className="w-3.5 h-3.5" />}
      {isMedium && <AlertTriangle className="w-3.5 h-3.5" />}
      {!isHigh && !isMedium && <Info className="w-3.5 h-3.5" />}
      <span>{severity.toUpperCase()} PRIORITY</span>
    </span>
  );
};

export interface AlertLifecycleBadgeProps {
  status: AlertStatus | string;
  size?: "sm" | "md";
  className?: string;
}

export const AlertLifecycleBadge: React.FC<AlertLifecycleBadgeProps> = ({
  status,
  size = "md",
  className,
}) => {
  const isNew = status === "new";
  const isAck = status === "acknowledged";
  const isResolved = status === "resolved";
  const isFalsePositive = status === "false_positive";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-mono uppercase tracking-wider select-none font-semibold",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        isNew && "bg-status-critical/15 text-status-critical border border-status-critical/30",
        isAck && "bg-brand-amber/15 text-brand-amber border border-brand-amber/30",
        isResolved && "bg-status-success/15 text-status-success border border-status-success/30",
        isFalsePositive && "bg-surface-3 text-text-muted border border-border-normal",
        className
      )}
    >
      {isNew && <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse" />}
      {isAck && <Clock className="w-3 h-3 text-brand-amber" />}
      {isResolved && <CheckCircle2 className="w-3 h-3 text-status-success" />}
      {isFalsePositive && <XCircle className="w-3 h-3 text-text-muted" />}
      <span>{status.replace("_", " ").toUpperCase()}</span>
    </span>
  );
};

