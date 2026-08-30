import React from "react";
import { KpiCard, Skeleton } from "../../components/ui";
import { Flame, Building2, AlertTriangle, Radio } from "lucide-react";
import { DashboardSummary } from "../../api/types";

export interface CommandCenterKpisProps {
  summary?: DashboardSummary;
  isLoading: boolean;
}

export const CommandCenterKpis: React.FC<CommandCenterKpisProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const metrics = summary.metrics;
  const industrialTotal =
    (metrics.industrial_fires_count || 0) + (metrics.persistent_sources_count || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Thermal Events */}
      <KpiCard
        label="Total Thermal Detections"
        value={metrics.total_classified_events ?? metrics.total_hotspots ?? 0}
        sublabel="Ingested from NASA FIRMS NRT telemetry"
        icon={<Flame className="w-4 h-4 text-brand-orange" />}
        accent="orange"
      />

      {/* 2. Industrial Activity */}
      <KpiCard
        label="Industrial Sources"
        value={industrialTotal}
        sublabel={`${metrics.persistent_sources_count || 0} routine flares • ${metrics.industrial_fires_count || 0} hazard fires`}
        icon={<Building2 className="w-4 h-4 text-brand-amber" />}
        accent="warning"
      />

      {/* 3. Anomalous Activity (+3σ) */}
      <KpiCard
        label="Anomalous Activity (+3σ)"
        value={metrics.anomalous_events_count || 0}
        sublabel="Exceeded historical 90-day baseline"
        icon={<AlertTriangle className="w-4 h-4 text-status-critical" />}
        accent="critical"
      />

      {/* 4. Active Alerts */}
      <KpiCard
        label="Active Threat Alerts"
        value={metrics.active_alerts_count || 0}
        sublabel={`${metrics.high_severity_alerts_count || 0} high-priority requiring triage`}
        icon={<Radio className="w-4 h-4 text-intelligence-cyan" />}
        accent="cyan"
      />
    </div>
  );
};

