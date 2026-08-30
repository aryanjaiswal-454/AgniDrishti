import React from "react";
import { ArrowLeft, Building2, MapPin, Database, RefreshCw, ShieldCheck, ExternalLink } from "lucide-react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button, Skeleton, ErrorState } from "../../components/ui";
import { useFacility, useFacilityTimeseries } from "../../hooks/useFacilities";
import { FacilityTypeBadge } from "./FacilityTypeBadge";
import { FacilityTimeseriesChart } from "./FacilityTimeseriesChart";

export interface FacilityDetailPageProps {
  facilityId: string;
  onNavigate: (route: string) => void;
}

export const FacilityDetailPage: React.FC<FacilityDetailPageProps> = ({
  facilityId,
  onNavigate,
}) => {
  const {
    data: facilityRes,
    isLoading: isFacilityLoading,
    error: facilityError,
    refetch: refetchFacility,
  } = useFacility(facilityId);

  const {
    data: timeseriesRes,
    isLoading: isTimeseriesLoading,
    refetch: refetchTimeseries,
  } = useFacilityTimeseries(facilityId);

  const facility = facilityRes?.data;
  const timeseries = timeseriesRes?.data;

  const handleRefresh = () => {
    refetchFacility();
    refetchTimeseries();
  };

  if (isFacilityLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-24 h-8 rounded-lg" />
            <Skeleton className="w-48 h-8 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (facilityError || !facility) {
    return (
      <PageContainer>
        <div className="pt-8">
          <ErrorState
            title="FACILITY RECORD NOT FOUND"
            message={
              facilityError?.message ||
              "The requested industrial asset could not be retrieved from the PostGIS database."
            }
            onRetry={handleRefresh}
          />
          <div className="mt-4 text-center">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onNavigate("/facilities")}
            >
              Back to Facility Registry
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const facilityName = facility.name || "Unnamed Facility";

  // Extract coordinate string if point geometry available
  let coordinates = "Coordinates mapped via OSM polygon";
  if (
    facility.geometry &&
    facility.geometry.type === "Point" &&
    Array.isArray(facility.geometry.coordinates)
  ) {
    const coords = facility.geometry.coordinates;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      coordinates = `${coords[1].toFixed(4)}° N, ${coords[0].toFixed(4)}° E`;
    }
  }

  const baseline = facility.baseline;

  return (
    <PageContainer>
      {/* Top Breadcrumb Header */}
      <PageHeader
        title={facilityName}
        subtitle={`${facility.state || "National"}${facility.district ? ` • ${facility.district}` : ""} • Industrial Critical Infrastructure`}
        badge={<FacilityTypeBadge type={facility.facility_type} size="md" />}
        breadcrumbs={[
          { label: "AgniDrishti", href: "/command-center" },
          { label: "Facilities", href: "/facilities" },
          { label: facilityName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onNavigate("/facilities")}
            >
              Back to Registry
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Key Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Rolling 90-Day Avg FRP
            </div>
            <div className="text-2xl font-mono font-bold text-brand-orange">
              {baseline?.avg_frp ? `${baseline.avg_frp} MW` : "Not available"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              {baseline ? `Std Dev: ±${baseline.std_dev_frp} MW` : "Baseline not established"}
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Avg Daily Hotspots
            </div>
            <div className="text-2xl font-mono font-bold text-intelligence-cyan">
              {baseline?.avg_daily_detections !== undefined
                ? `${baseline.avg_daily_detections} / day`
                : "Not available"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              Satellite VIIRS/MODIS observations
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Total Classified Events
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {facility.total_events !== undefined ? facility.total_events : "Not available"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              Historical thermal instances
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Anomalous Hazard Events
            </div>
            <div className="text-2xl font-mono font-bold text-status-critical">
              {facility.anomalous_events_count !== undefined
                ? facility.anomalous_events_count
                : "0"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              {facility.anomalous_events_count && facility.anomalous_events_count > 0
                ? "Exceeded rolling FRP baseline (+3σ)"
                : "Nominal operational status"}
            </div>
          </Card>
        </div>

        {/* Investigation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Timeseries Chart & Event Overview */}
          <div className="lg:col-span-8 space-y-6">
            <FacilityTimeseriesChart data={timeseries} isLoading={isTimeseriesLoading} />

            {/* Thermal Activity Surveillance Notes */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <ShieldCheck className="w-4 h-4 text-status-success" />
                <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Baseline Calibration & Surveillance Context
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono text-text-secondary leading-relaxed">
                <p>
                  AgniDrishti maintains a rolling 90-day radiometric baseline for all registered industrial facilities. Thermal emissions within the 1,000m buffer zone are analyzed against expected operational heat profiles (e.g. routine flare stacks vs non-routine industrial fires).
                </p>
                <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-text-muted block">Baseline Window Start:</span>
                    <span className="text-text-primary font-semibold">
                      {baseline?.window_start ? new Date(baseline.window_start).toLocaleDateString() : "Not available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Baseline Window End:</span>
                    <span className="text-text-primary font-semibold">
                      {baseline?.window_end ? new Date(baseline.window_end).toLocaleDateString() : "Not available"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right 4 Cols: Facility Specs & Provenance */}
          <div className="lg:col-span-4 space-y-6">
            {/* Facility Identity Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Building2 className="w-4 h-4 text-brand-orange" />
                <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Facility Specifications
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Internal Asset UUID</div>
                  <div className="text-text-secondary font-mono break-all text-[11px] mt-0.5">
                    {facility.id}
                  </div>
                </div>

                {facility.osm_id && (
                  <div>
                    <div className="text-[10px] text-text-muted uppercase">OpenStreetMap OSM_ID</div>
                    <div className="text-text-primary mt-0.5 flex items-center gap-1.5">
                      <span>#{facility.osm_id}</span>
                      <a
                        href={`https://www.openstreetmap.org/search?query=${facility.osm_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-intelligence-cyan hover:underline inline-flex items-center"
                      >
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-text-muted uppercase">Coordinates (EPSG:4326)</div>
                  <div className="text-text-primary mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-amber shrink-0" />
                    <span>{coordinates}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-text-muted uppercase">Administrative Region</div>
                  <div className="text-text-primary mt-0.5">
                    {facility.state ? `${facility.state}${facility.district ? `, ${facility.district}` : ""}` : "Not specified"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-text-muted uppercase">Spatial Buffer Zone</div>
                  <div className="text-text-primary mt-0.5">
                    1,000 meters (PostGIS GiST R-Tree)
                  </div>
                </div>
              </div>
            </Card>

            {/* Ingestion & Provenance Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Database className="w-4 h-4 text-intelligence-cyan" />
                <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Source & Provenance
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Data Provider:</span>
                  <Badge variant="cyan" size="sm">
                    {facility.source?.toUpperCase() || "OSM OVERPASS"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Last Synced:</span>
                  <span className="text-text-primary text-[11px]">
                    {facility.last_synced_at
                      ? new Date(facility.last_synced_at).toLocaleString()
                      : "Not recorded"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

