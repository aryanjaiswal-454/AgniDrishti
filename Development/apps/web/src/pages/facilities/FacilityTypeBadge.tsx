import React from "react";
import { FacilityType } from "@agnidrishti/shared-types";
import { Flame, Zap, Layers, Mountain, Fuel, Factory, Building2 } from "lucide-react";
import { cn } from "../../design-system/utils";

export interface FacilityTypeBadgeProps {
  type: FacilityType | string;
  size?: "sm" | "md";
  className?: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  refinery: {
    label: "Refinery",
    icon: <Flame className="w-3.5 h-3.5" />,
    bg: "bg-brand-orange/15",
    text: "text-brand-orange",
    border: "border-brand-orange/30",
  },
  petrochemical: {
    label: "Petrochemical",
    icon: <Factory className="w-3.5 h-3.5" />,
    bg: "bg-brand-amber/15",
    text: "text-brand-amber",
    border: "border-brand-amber/30",
  },
  power_plant: {
    label: "Power Plant",
    icon: <Zap className="w-3.5 h-3.5" />,
    bg: "bg-intelligence-cyan/15",
    text: "text-intelligence-cyan",
    border: "border-intelligence-cyan/30",
  },
  steel: {
    label: "Steel Mill",
    icon: <Layers className="w-3.5 h-3.5" />,
    bg: "bg-status-info/15",
    text: "text-status-info",
    border: "border-status-info/30",
  },
  mining: {
    label: "Mining Zone",
    icon: <Mountain className="w-3.5 h-3.5" />,
    bg: "bg-status-warning/15",
    text: "text-status-warning",
    border: "border-status-warning/30",
  },
  lng_terminal: {
    label: "LNG Terminal",
    icon: <Fuel className="w-3.5 h-3.5" />,
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  other_industrial: {
    label: "Industrial",
    icon: <Building2 className="w-3.5 h-3.5" />,
    bg: "bg-surface-3",
    text: "text-text-secondary",
    border: "border-border-normal",
  },
};

export const FacilityTypeBadge: React.FC<FacilityTypeBadgeProps> = ({
  type,
  size = "md",
  className,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.other_industrial;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-mono font-medium border select-none",
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

