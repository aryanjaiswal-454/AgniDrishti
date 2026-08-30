import React from "react";
import { Badge, BadgeProps } from "./Badge";

export type EventStatusType =
  | "industrial_fire"
  | "gas_flare"
  | "agricultural_burning"
  | "forest_fire"
  | "mining_activity"
  | "anomalous"
  | "nominal"
  | "critical"
  | "acknowledged"
  | "resolved";

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: EventStatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, ...props }) => {
  const statusMap: Record<string, { label: string; variant: BadgeProps["variant"]; dot: boolean }> = {
    industrial_fire: { label: "Industrial Fire", variant: "critical", dot: true },
    gas_flare: { label: "Gas Flare", variant: "brand", dot: false },
    agricultural_burning: { label: "Agri Burning", variant: "warning", dot: false },
    forest_fire: { label: "Forest Fire", variant: "critical", dot: true },
    mining_activity: { label: "Mining Thermal", variant: "info", dot: false },
    anomalous: { label: "Anomalous", variant: "critical", dot: true },
    nominal: { label: "Nominal", variant: "success", dot: false },
    critical: { label: "Critical Threat", variant: "critical", dot: true },
    acknowledged: { label: "Acknowledged", variant: "warning", dot: false },
    resolved: { label: "Resolved", variant: "success", dot: false },
  };

  const config = statusMap[status] || {
    label: status.replace(/_/g, " "),
    variant: "default" as BadgeProps["variant"],
    dot: false,
  };

  return (
    <Badge variant={config.variant} dot={config.dot} className={className} {...props}>
      {config.label}
    </Badge>
  );
};

