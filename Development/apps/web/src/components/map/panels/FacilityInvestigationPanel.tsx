import React from "react";
import { FacilityMarkerData } from "../types";
import { useFacility, useFacilityTimeseries } from "../../../hooks/useFacilities";
import { FacilityTypeBadge } from "../../../pages/facilities/FacilityTypeBadge";
import { FacilityTimeseriesChart } from "../../../pages/facilities/FacilityTimeseriesChart";
import { Button, Skeleton } from "../../ui";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  Activity,
  AlertTriangle,
  MapPin,
  Database,
  Calendar,
} from "lucide-react";

export interface FacilityInvestigationPanelProps {
  facilityMarker: FacilityMarkerData;
  onNavigate: (route: string) => void;
}

export const FacilityInvestigationPanel: React.FC<FacilityInvestigationPanelProps> = ({
  facilityMarker,
  onNavigate,
}) => {
  // Query full facility details (including baseline statistics & event counts)
  const {
    data: facilityRes,
    isLoading: isFacilityLoading,
    error: facilityError,
    refetch: refetchFacility,
  } = useFacility(facilityMarker.id);

  // Query 90-day historical thermal timeseries for Recharts
  const {
    data: timeseriesRes,
    isLoading: isTimeseriesLoading,
    error: timeseriesError,
    refetch: refetchTimeseries,
  } = useFacilityTimeseries(facilityMarker.id);

  const facilityDetail = facilityRes?.data;
  const baseline = facilityDetail?.baseline;
  const timeseries = timeseriesRes?.data;

  const anomalousCount = facilityDetail?.anomalous_events_count ?? 0;
  const totalEvents = facilityDetail?.total_events;

  return (
    <div className="space-y-3.5" data-testid="facility-investigation-panel">
      {/* 1. Facility Header & Type */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-text-primary truncate">
            {facilityMarker.name}
          </h3>
          <FacilityTypeBadge type={facilityMarker.facility_type} size="sm" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <MapPin className="w-3 h-3 text-brand-amber shrink-0" />
          <span>
            {facilityMarker.state || "National Jurisdiction"}
            {facilityMarker.district ? ` • ${facilityMarker.district}` : ""}
          </span>
        </div>
      </div>

      {/* 2. Core Metadata Specifications */}
      <div className="p-3 rounded-lg bg-surface-2/80 border border-border-subtle space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Coordinates:</span>
          <span className="text-text-primary font-mono">
            {facilityMarker.lat.toFixed(4)}°, {facilityMarker.lon.toFixed(4)}°
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-muted">Provenance / Source:</span>
          <span className="text-text-primary uppercase font-medium">
            {facilityMarker.source || "OSM OVERPASS"}
          </span>
        </div>

        {facilityDetail?.last_synced_at && (
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Last Synced:</span>
            <span className="text-text-primary text-[10px]">
              {new Date(facilityDetail.last_synced_at).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-text-muted">Surveillance Buffer:</span>
          <span className="text-intelligence-cyan font-medium">1,000m R-Tree</span>
        </div>
      </div>

      {/* 3. Baseline Calibration Context (90-Day Operational Baseline) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>90-Day Baseline Profile</span>
        </div>

        {isFacilityLoading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Avg FRP */}
            <div className="p-2.5 rounded-lg bg-surface-2/90 border border-border-subtle space-y-0.5">
              <div className="text-[10px] text-text-muted uppercase">Avg FRP</div>
              <div className="text-sm font-bold text-brand-orange">
                {baseline?.avg_frp ? `${baseline.avg_frp} MW` : "N/A"}
              </div>
              <div className="text-[9px] text-text-muted">
                {baseline?.std_dev_frp ? `±${baseline.std_dev_frp} MW std dev` : "Baseline pending"}
              </div>
            </div>

            {/* Daily Detections */}
            <div className="p-2.5 rounded-lg bg-surface-2/90 border border-border-subtle space-y-0.5">
              <div className="text-[10px] text-text-muted uppercase">Daily Hotspots</div>
              <div className="text-sm font-bold text-intelligence-cyan">
                {baseline?.avg_daily_detections !== undefined
                  ? `${baseline.avg_daily_detections} / day`
                  : "N/A"}
              </div>
              <div className="text-[9px] text-text-muted">VIIRS/MODIS rate</div>
            </div>

            {/* Total Classified Events */}
            <div className="p-2.5 rounded-lg bg-surface-2/90 border border-border-subtle space-y-0.5">
              <div className="text-[10px] text-text-muted uppercase">Classified Events</div>
              <div className="text-sm font-bold text-text-primary">
                {totalEvents !== undefined ? totalEvents : "N/A"}
              </div>
              <div className="text-[9px] text-text-muted">Historical total</div>
            </div>

            {/* Anomalous Exceedances */}
            <div className="p-2.5 rounded-lg bg-surface-2/90 border border-border-subtle space-y-0.5">
              <div className="text-[10px] text-text-muted uppercase">Anomalies (+3σ)</div>
              <div
                className={`text-sm font-bold ${
                  anomalousCount > 0 ? "text-status-critical" : "text-text-primary"
                }`}
              >
                {anomalousCount}
              </div>
              <div className="text-[9px] text-text-muted">
                {anomalousCount > 0 ? "Hazard exceedance" : "Nominal status"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Thermal Activity Timeseries (90-Day Radiometric Curve) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
          <span>Facility Buffer (1,000m)</span>
          <span className="text-brand-orange">Radiometric Timeseries</span>
        </div>

        <FacilityTimeseriesChart
          data={timeseries}
          isLoading={isTimeseriesLoading}
          error={timeseriesError}
          onRetry={refetchTimeseries}
          compact={true}
        />
      </div>
    </div>
  );
};

