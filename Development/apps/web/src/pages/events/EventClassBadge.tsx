import React from "react";
import { PrimaryClass, SubClass } from "@agnidrishti/shared-types";
import { Flame, Trees, Wheat, Mountain, AlertOctagon, HelpCircle, Activity } from "lucide-react";
import { cn } from "../../design-system/utils";

export interface EventClassBadgeProps {
  primaryClass?: PrimaryClass | null;
  subClass?: SubClass | string | null;
  size?: "sm" | "md";
  className?: string;
}

const SUB_CLASS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  industrial_fire: {
    label: "Industrial Fire",
    icon: <AlertOctagon className="w-3.5 h-3.5" />,
    bg: "bg-status-critical/15",
    text: "text-status-critical",
    border: "border-status-critical/30",
  },
  gas_flare: {
    label: "Gas Flare Stack",
    icon: <Flame className="w-3.5 h-3.5" />,
    bg: "bg-brand-orange/15",
    text: "text-brand-orange",
    border: "border-brand-orange/30",
  },
  mining_activity: {
    label: "Mining Thermal",
    icon: <Mountain className="w-3.5 h-3.5" />,
    bg: "bg-brand-amber/15",
    text: "text-brand-amber",
    border: "border-brand-amber/30",
  },
  forest_fire: {
    label: "Forest Wildfire",
    icon: <Trees className="w-3.5 h-3.5" />,
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  agricultural_burning: {
    label: "Agri Stubble Burning",
    icon: <Wheat className="w-3.5 h-3.5" />,
    bg: "bg-intelligence-cyan/15",
    text: "text-intelligence-cyan",
    border: "border-intelligence-cyan/30",
  },
  other_natural: {
    label: "Natural Thermal",
    icon: <Activity className="w-3.5 h-3.5" />,
    bg: "bg-status-info/15",
    text: "text-status-info",
    border: "border-status-info/30",
  },
  unclassified: {
    label: "Unclassified",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    bg: "bg-surface-3",
    text: "text-text-muted",
    border: "border-border-normal",
  },
};

export const EventClassBadge: React.FC<EventClassBadgeProps> = ({
  subClass,
  size = "md",
  className,
}) => {
  const key = subClass || "unclassified";
  const config = SUB_CLASS_CONFIG[key] || SUB_CLASS_CONFIG.unclassified;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-mono font-medium border select-none whitespace-nowrap",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export const AnomalyBadge: React.FC<{ isAnomalous: boolean; size?: "sm" | "md"; className?: string }> = ({
  isAnomalous,
  size = "md",
  className,
}) => {
  if (isAnomalous) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded font-mono font-bold border select-none bg-status-critical/15 text-status-critical border-status-critical/40 shadow-sm",
          size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-ping" />
        <span>ANOMALOUS SIGNAL</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-mono font-medium border select-none bg-surface-2 text-text-secondary border-border-subtle",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-intelligence-cyan/70" />
      <span>NOMINAL / NON-ANOMALOUS</span>
    </span>
  );
};

