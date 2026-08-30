import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { FacilityTimeseriesPoint } from "../../api/types";
import { Card, Button, Skeleton } from "../../components/ui";
import { Activity, Thermometer, AlertTriangle, RefreshCw } from "lucide-react";

export interface FacilityTimeseriesChartProps {
  data?: FacilityTimeseriesPoint[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const point: FacilityTimeseriesPoint = payload[0].payload;
    return (
      <div className="p-2.5 rounded-lg bg-surface-1/95 border border-border-normal backdrop-blur-md shadow-glass text-xs font-mono space-y-1 min-w-[170px] z-[2000]">
        <div className="text-text-muted text-[10px] pb-1 border-b border-border-subtle">
          ACQ DATE: {label}
        </div>
        <div className="flex items-center justify-between text-brand-orange">
          <span>Avg FRP:</span>
          <span className="font-bold">{point.avg_frp} MW</span>
        </div>
        <div className="flex items-center justify-between text-brand-amber">
          <span>Peak FRP:</span>
          <span className="font-bold">{point.max_frp} MW</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>Detections:</span>
          <span>{point.detections_count}</span>
        </div>
        {point.anomalous_count > 0 && (
          <div className="flex items-center justify-between text-status-critical font-semibold pt-1 border-t border-border-subtle text-[11px]">
            <span>Anomalies (+3σ):</span>
            <span>{point.anomalous_count}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const FacilityTimeseriesChart: React.FC<FacilityTimeseriesChartProps> = ({
  data = [],
  isLoading = false,
  error = null,
  onRetry,
  compact = false,
  className = "",
}) => {
  const heightClass = compact ? "h-44 sm:h-48" : "h-64 sm:h-72";

  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-xl bg-surface-2/60 border border-border-subtle flex flex-col items-center justify-center space-y-2 ${heightClass} ${className}`}
      >
        <Activity className="w-5 h-5 text-brand-orange animate-pulse" />
        <span className="text-xs font-mono text-text-muted">Loading thermal timeseries telemetry...</span>
        <Skeleton className="w-3/4 h-2 rounded mt-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 rounded-xl bg-status-critical/5 border border-status-critical/20 flex flex-col items-center justify-center text-center space-y-2 ${heightClass} ${className}`}
      >
        <AlertTriangle className="w-5 h-5 text-status-critical" />
        <span className="text-xs font-mono font-semibold text-text-primary">
          THERMAL HISTORY UNAVAILABLE
        </span>
        <p className="text-[11px] font-mono text-text-muted max-w-xs">
          {error.message || "Failed to load radiometric timeseries for this facility."}
        </p>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3 h-3" />}
            onClick={onRetry}
            className="mt-1"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={`p-5 rounded-xl bg-surface-2/30 border border-dashed border-border-subtle flex flex-col items-center justify-center text-center space-y-1.5 ${heightClass} ${className}`}
      >
        <div className="p-2 rounded-lg bg-surface-2 text-text-muted">
          <Thermometer className="w-4 h-4" />
        </div>
        <div className="text-xs font-mono font-semibold text-text-primary">
          NO HISTORICAL THERMAL ACTIVITY AVAILABLE
        </div>
        <p className="text-[11px] font-mono text-text-muted max-w-xs leading-relaxed">
          No satellite thermal observations have intersected the 1,000m buffer zone of this asset in the available baseline dataset.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Chart Header with Legend */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-brand-orange" />
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
            {compact ? "FRP Radiometric History" : "Thermal Radiation Power (FRP) History"}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            <span>Avg (MW)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-amber" />
            <span>Peak</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className={`w-full ${heightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="frpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF7A18" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF7A18" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1B222C" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#5A6578"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              dy={4}
            />
            <YAxis
              stroke="#5A6578"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              unit=" MW"
              width={42}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avg_frp"
              stroke="#FF7A18"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#frpGradient)"
            />
            <Area
              type="monotone"
              dataKey="max_frp"
              stroke="#FFB547"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

