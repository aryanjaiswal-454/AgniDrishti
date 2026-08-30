import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Flame,
  Calendar,
  Building2,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { PageContainer, PageHeader } from "../../components/shell";
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  ConfidenceIndicator,
} from "../../components/ui";
import { useEvents } from "../../hooks/useEvents";
import { PrimaryClass, SubClass } from "@agnidrishti/shared-types";
import { EventClassBadge, AnomalyBadge } from "./EventClassBadge";
import { EventFilterParams } from "../../api/types";

export interface ThermalEventsPageProps {
  onNavigate: (route: string) => void;
}

const PRIMARY_CLASS_OPTIONS = [
  { value: "", label: "All Primary Classes" },
  { value: "industrial", label: "Industrial Thermal Sources" },
  { value: "natural", label: "Natural / Agricultural" },
];

const SUB_CLASS_OPTIONS = [
  { value: "", label: "All Sub-Classifications" },
  { value: "industrial_fire", label: "Industrial Fire (Hazard)" },
  { value: "gas_flare", label: "Gas Flare Stack" },
  { value: "mining_activity", label: "Mining Activity" },
  { value: "forest_fire", label: "Forest Wildfire" },
  { value: "agricultural_burning", label: "Agri Stubble Burning" },
  { value: "other_natural", label: "Other Natural Source" },
  { value: "unclassified", label: "Unclassified" },
];

const ANOMALY_OPTIONS = [
  { value: "", label: "All Anomaly States" },
  { value: "true", label: "Anomalous Signals Only (+3σ)" },
  { value: "false", label: "Nominal / Baseline Operations" },
];

const CONFIDENCE_OPTIONS = [
  { value: "", label: "All Confidence Scores" },
  { value: "0.9", label: "High Confidence (≥ 90%)" },
  { value: "0.8", label: "Medium Confidence (≥ 80%)" },
  { value: "0.7", label: "Base Confidence (≥ 70%)" },
];

export const ThermalEventsPage: React.FC<ThermalEventsPageProps> = ({ onNavigate }) => {
  const [primaryClass, setPrimaryClass] = useState<string>("");
  const [subClass, setSubClass] = useState<string>("");
  const [isAnomalous, setIsAnomalous] = useState<string>("");
  const [minConfidence, setMinConfidence] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [debouncedDistrict, setDebouncedDistrict] = useState<string>("");

  const [pageLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  // Debounce district
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDistrict(districtFilter.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [districtFilter]);

  // Construct typed backend filter params
  const queryParams: EventFilterParams = useMemo(() => {
    const params: EventFilterParams = {
      limit: pageLimit,
      offset,
    };
    if (primaryClass) params.primary_class = primaryClass as PrimaryClass;
    if (subClass) params.sub_class = subClass as SubClass;
    if (isAnomalous !== "") params.is_anomalous = isAnomalous === "true";
    if (minConfidence) params.min_confidence = parseFloat(minConfidence);
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (stateFilter) params.state = stateFilter;
    if (debouncedDistrict) params.district = debouncedDistrict;
    return params;
  }, [
    primaryClass,
    subClass,
    isAnomalous,
    minConfidence,
    startDate,
    endDate,
    stateFilter,
    debouncedDistrict,
    pageLimit,
    offset,
  ]);

  const { data, isLoading, error, refetch, isFetching } = useEvents(queryParams);

  const events = data?.data || [];
  const paginationMeta = (data as any)?.meta || (data as any)?.pagination;
  const totalCount = paginationMeta?.total ?? events.length;

  const isFiltered = Boolean(
    primaryClass ||
      subClass ||
      isAnomalous ||
      minConfidence ||
      startDate ||
      endDate ||
      stateFilter ||
      districtFilter
  );

  const handleClearFilters = () => {
    setPrimaryClass("");
    setSubClass("");
    setIsAnomalous("");
    setMinConfidence("");
    setStartDate("");
    setEndDate("");
    setStateFilter("");
    setDistrictFilter("");
    setDebouncedDistrict("");
    setOffset(0);
  };

  const handleNextPage = () => {
    if (offset + pageLimit < totalCount) {
      setOffset((prev) => prev + pageLimit);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset((prev) => Math.max(0, prev - pageLimit));
    }
  };

  return (
    <PageContainer>
      {/* Top Page Header */}
      <PageHeader
        title="THERMAL EVENT INTELLIGENCE"
        subtitle="Investigate classified thermal events, anomalies and persistent sources."
        badge={
          <Badge variant="brand" dot>
            {isLoading ? "Querying Telemetry..." : `${totalCount} Classified Events`}
          </Badge>
        }
        breadcrumbs={[
          { label: "AgniDrishti", href: "/command-center" },
          { label: "Thermal Events" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Controls & Filter Panel */}
        <Card className="p-4 sm:p-5 space-y-3 bg-surface-1 border-border-subtle shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Primary Class Filter */}
            <Select
              options={PRIMARY_CLASS_OPTIONS}
              value={primaryClass}
              onChange={(e) => {
                setPrimaryClass(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* Sub Class Filter */}
            <Select
              options={SUB_CLASS_OPTIONS}
              value={subClass}
              onChange={(e) => {
                setSubClass(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* Anomaly Filter */}
            <Select
              options={ANOMALY_OPTIONS}
              value={isAnomalous}
              onChange={(e) => {
                setIsAnomalous(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* Confidence Threshold */}
            <Select
              options={CONFIDENCE_OPTIONS}
              value={minConfidence}
              onChange={(e) => {
                setMinConfidence(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Start Date */}
            <Input
              type="date"
              label="START DATE"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* End Date */}
            <Input
              type="date"
              label="END DATE"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* State Filter */}
            <Input
              label="STATE"
              placeholder="e.g. Gujarat, Jharkhand"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* District Filter */}
            <div className="relative">
              <Input
                label="DISTRICT"
                placeholder="e.g. Jamnagar, Bokaro"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="font-mono text-xs"
              />
              {districtFilter && (
                <button
                  type="button"
                  onClick={() => setDistrictFilter("")}
                  className="absolute right-2.5 top-[28px] text-text-muted hover:text-text-primary p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges & Clear */}
          {isFiltered && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2 text-text-muted">
                <span className="flex items-center gap-1 text-[11px] text-brand-orange uppercase">
                  <Filter className="w-3 h-3" />
                  Active Filters:
                </span>
                {primaryClass && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    Class: {primaryClass}
                  </span>
                )}
                {subClass && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    Sub-Class: {subClass}
                  </span>
                )}
                {isAnomalous !== "" && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    {isAnomalous === "true" ? "Anomalous Only" : "Nominal Only"}
                  </span>
                )}
                {minConfidence && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    Confidence ≥ {Math.round(parseFloat(minConfidence) * 100)}%
                  </span>
                )}
                {startDate && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    From: {startDate}
                  </span>
                )}
                {endDate && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    To: {endDate}
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-text-muted hover:text-brand-orange h-7 px-2"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </Card>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="w-48 h-5 rounded" />
                  <Skeleton className="w-72 h-3 rounded" />
                </div>
                <Skeleton className="w-24 h-6 rounded" />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState
            title="FAILED TO RETRIEVE THERMAL EVENTS"
            message={error.message || "An error occurred while communicating with the intelligence service."}
            onRetry={() => refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <EmptyState
            title="NO THERMAL EVENTS MATCH THE CURRENT FILTERS"
            description={
              isFiltered
                ? "Try adjusting classification filters, date range, or confidence thresholds."
                : "No active thermal events have been detected in the current observation window."
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Events Data Table (Desktop) & Cards (Mobile) */}
        {!isLoading && !error && events.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Intelligence Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border-subtle bg-surface-1 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-2/60 text-[10px] font-mono uppercase tracking-wider text-text-muted select-none">
                    <th className="py-3.5 px-4 font-semibold">Event / Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Classification</th>
                    <th className="py-3.5 px-4 font-semibold">Confidence</th>
                    <th className="py-3.5 px-4 font-semibold">Anomaly State</th>
                    <th className="py-3.5 px-4 font-semibold">Radiative Power</th>
                    <th className="py-3.5 px-4 font-semibold">Facility Proximity</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Triage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs font-mono">
                  {events.map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => onNavigate(`/events/${evt.id}`)}
                      className="group hover:bg-surface-2/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary font-mono group-hover:text-brand-orange transition-colors">
                          EVT-{evt.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          <span>
                            {evt.hotspot?.acq_date || new Date(evt.created_at).toLocaleDateString()}{" "}
                            {evt.hotspot?.acq_time ? `• ${evt.hotspot.acq_time} UTC` : ""}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <EventClassBadge primaryClass={evt.primary_class} subClass={evt.sub_class} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <ConfidenceIndicator score={evt.confidence_score} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <AnomalyBadge isAnomalous={evt.is_anomalous} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 font-mono text-text-primary">
                        {evt.hotspot?.frp ? (
                          <span className="font-bold text-brand-orange">{evt.hotspot.frp} MW</span>
                        ) : (
                          <span className="text-text-muted">Not recorded</span>
                        )}
                        {evt.z_score_frp !== null && evt.z_score_frp !== undefined && (
                          <div className="text-[10px] text-text-muted font-mono">
                            Z-score: +{evt.z_score_frp}σ
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {evt.facility?.name ? (
                          <div>
                            <div className="text-text-primary font-semibold text-[11px] truncate max-w-[160px]">
                              {evt.facility.name}
                            </div>
                            <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-brand-amber" />
                              <span>
                                {evt.distance_to_facility_m !== null && evt.distance_to_facility_m !== undefined
                                  ? `${evt.distance_to_facility_m}m buffer`
                                  : "Intersecting buffer"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-muted text-[11px]">No registered facility</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                          className="text-[11px] group-hover:text-brand-orange"
                        >
                          Investigate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Tactical Cards View */}
            <div className="md:hidden space-y-3">
              {events.map((evt) => (
                <Card
                  key={evt.id}
                  onClick={() => onNavigate(`/events/${evt.id}`)}
                  className="p-4 space-y-3 cursor-pointer hover:border-brand-orange/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-text-primary font-mono text-xs">
                        EVT-{evt.id.substring(0, 8).toUpperCase()}
                      </h4>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">
                        {evt.hotspot?.acq_date || new Date(evt.created_at).toLocaleDateString()}
                        {evt.hotspot?.acq_time ? ` • ${evt.hotspot.acq_time} UTC` : ""}
                      </p>
                    </div>
                    <AnomalyBadge isAnomalous={evt.is_anomalous} size="sm" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <EventClassBadge primaryClass={evt.primary_class} subClass={evt.sub_class} size="sm" />
                    <ConfidenceIndicator score={evt.confidence_score} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs font-mono text-text-secondary">
                    <span>FRP: {evt.hotspot?.frp ? `${evt.hotspot.frp} MW` : "N/A"}</span>
                    <span className="text-brand-orange text-[11px] flex items-center">
                      Investigate &rarr;
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface-1 border border-border-subtle rounded-xl text-xs font-mono text-text-muted">
              <div>
                Showing{" "}
                <span className="text-text-primary font-semibold">
                  {events.length === 0 ? 0 : offset + 1}
                </span>{" "}
                to{" "}
                <span className="text-text-primary font-semibold">
                  {Math.min(offset + pageLimit, totalCount)}
                </span>{" "}
                of <span className="text-text-primary font-semibold">{totalCount}</span> events
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  onClick={handleNextPage}
                  disabled={offset + pageLimit >= totalCount}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

