import React, { useMemo } from "react";
import { GisMapContainer } from "../../components/map";
import { GisFilterBar, GisFilterDrawer, ActiveFilterChips, FilteredSummaryStrip } from "../../components/map/filters";
import { useEvents } from "../../hooks/useEvents";
import { useFacilities } from "../../hooks/useFacilities";
import { useGisFilters } from "../../hooks/useGisFilters";
import { Badge, Button, EmptyState } from "../../components/ui";
import { Map, Flame, Building2, AlertTriangle, SearchX } from "lucide-react";

export interface LiveMapPageProps {
  onNavigate: (route: string) => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({ onNavigate }) => {
  const gisFilters = useGisFilters("/live-map");

  const { data: eventsRes, isLoading: eventsLoading } = useEvents(gisFilters.eventParams);
  const { data: facilitiesRes, isLoading: facilitiesLoading } = useFacilities(gisFilters.facilityParams);

  const events = eventsRes?.data || [];
  const facilities = facilitiesRes?.data || [];
  const isLoading = eventsLoading || facilitiesLoading;

  // Derived filtered counts from actual API data
  const anomalousCount = useMemo(() => events.filter((e) => e.is_anomalous).length, [events]);
  const industrialCount = useMemo(() => events.filter((e) => e.primary_class === "industrial").length, [events]);

  return (
    <div className="space-y-3">
      {/* Top Header & Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-1 border border-border-subtle shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-brand-orange" />
            <h1 className="text-base sm:text-lg font-bold text-text-primary uppercase tracking-wider font-mono">
              Live Geospatial Intelligence
            </h1>
            <Badge variant="cyan" size="sm">
              FULL SCREEN GIS
            </Badge>
          </div>
          <p className="text-xs text-text-secondary font-mono mt-0.5">
            Near-Real-Time (NRT) multi-spectral thermal hotspot detection and industrial facility fusion.
          </p>
        </div>

        {/* Telemetry Summary & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-2 border border-border-subtle">
            <span className="text-text-muted flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-brand-orange" />
              {events.length} Hotspots
            </span>
            <span className="text-border-normal">•</span>
            <span className="text-text-muted flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-intelligence-cyan" />
              {facilities.length} Assets
            </span>
            {anomalousCount > 0 && (
              <>
                <span className="text-border-normal">•</span>
                <span className="text-status-critical font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {anomalousCount} Anomalies
                </span>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ─── Desktop Filter Bar ─── */}
      <GisFilterBar
        filters={gisFilters.filters}
        onSetDateRange={gisFilters.setDateRange}
        onSetDateFrom={gisFilters.setDateFrom}
        onSetDateTo={gisFilters.setDateTo}
        onSetPrimaryClass={gisFilters.setPrimaryClass}
        onSetSubClass={gisFilters.setSubClass}
        onSetMinConfidence={gisFilters.setMinConfidence}
        onSetAnomalyMode={gisFilters.setAnomalyMode}
        onSetState={gisFilters.setStateFilter}
        onSetDistrict={gisFilters.setDistrictFilter}
        onReset={gisFilters.resetFilters}
        activeFilterCount={gisFilters.activeFilterCount}
      />

      {/* ─── Mobile Filter Drawer Trigger ─── */}
      <GisFilterDrawer
        filters={gisFilters.filters}
        onSetDateRange={gisFilters.setDateRange}
        onSetDateFrom={gisFilters.setDateFrom}
        onSetDateTo={gisFilters.setDateTo}
        onSetPrimaryClass={gisFilters.setPrimaryClass}
        onSetSubClass={gisFilters.setSubClass}
        onSetMinConfidence={gisFilters.setMinConfidence}
        onSetAnomalyMode={gisFilters.setAnomalyMode}
        onSetState={gisFilters.setStateFilter}
        onSetDistrict={gisFilters.setDistrictFilter}
        onReset={gisFilters.resetFilters}
        activeFilterCount={gisFilters.activeFilterCount}
      />

      {/* ─── Active Filter Chips ─── */}
      {gisFilters.hasActiveFilters && (
        <ActiveFilterChips
          descriptors={gisFilters.activeFilterDescriptors}
          onClearFilter={gisFilters.clearFilter}
          onClearAll={gisFilters.resetFilters}
        />
      )}

      {/* ─── Filtered Summary Strip ─── */}
      <FilteredSummaryStrip
        totalEvents={events.length}
        anomalousCount={anomalousCount}
        industrialCount={industrialCount}
        facilityCount={facilities.length}
        isFiltered={gisFilters.hasActiveFilters}
      />

      {/* Primary Full-Height GIS Map Intelligence Container */}
      <div className="w-full h-[calc(100vh-320px)] min-h-[480px] max-h-[850px] relative">
        <GisMapContainer
          events={events}
          facilities={facilities}
          isLoading={isLoading}
          onNavigate={onNavigate}
          anomaliesOnlyFilter={false}
          enableInvestigationPanel={true}
          minHeight="h-full min-h-[480px]"
        />

        {/* Zero-result overlay when filters produce no events */}
        {!isLoading && events.length === 0 && gisFilters.hasActiveFilters && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto p-6 rounded-xl bg-surface/95 backdrop-blur-lg border border-border-normal shadow-2xl text-center max-w-sm">
              <SearchX className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider mb-1">
                No Thermal Events Match
              </p>
              <p className="text-xs text-text-secondary font-mono mb-4">
                The current filter configuration returned zero results. Adjust criteria or clear filters.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={gisFilters.resetFilters}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

