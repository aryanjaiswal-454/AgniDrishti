import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Building2,
  Filter,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Flame,
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
} from "../../components/ui";
import { useFacilities } from "../../hooks/useFacilities";
import { FacilityType } from "@agnidrishti/shared-types";
import { FacilityTypeBadge } from "./FacilityTypeBadge";
import { FacilityFilterParams } from "../../api/types";

export interface FacilitiesPageProps {
  onNavigate: (route: string) => void;
}

const FACILITY_TYPE_OPTIONS = [
  { value: "", label: "All Facility Types" },
  { value: "refinery", label: "Refineries" },
  { value: "petrochemical", label: "Petrochemical Complexes" },
  { value: "power_plant", label: "Power Generation Plants" },
  { value: "steel", label: "Steel Mills & Smelters" },
  { value: "mining", label: "Mining & Extraction Zones" },
  { value: "lng_terminal", label: "LNG Terminals" },
  { value: "other_industrial", label: "Other Industrial Facilities" },
];

const STATE_OPTIONS = [
  { value: "", label: "All States & UTs" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Odisha", label: "Odisha" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Karnataka", label: "Karnataka" },
];

export const FacilitiesPage: React.FC<FacilitiesPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [debouncedDistrict, setDebouncedDistrict] = useState<string>("");
  
  const [pageLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setOffset(0); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Debounce district input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDistrict(districtFilter.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [districtFilter]);

  // Construct typed query filters matching backend schema
  const queryParams: FacilityFilterParams = useMemo(() => {
    const params: FacilityFilterParams = {
      limit: pageLimit,
      offset,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedType) params.facility_type = selectedType as FacilityType;
    if (selectedState) params.state = selectedState;
    if (debouncedDistrict) params.district = debouncedDistrict;
    return params;
  }, [debouncedSearch, selectedType, selectedState, debouncedDistrict, pageLimit, offset]);

  const { data, isLoading, error, refetch, isFetching } = useFacilities(queryParams);

  const facilities = data?.data || [];
  const paginationMeta = (data as any)?.meta || (data as any)?.pagination;
  const totalCount = paginationMeta?.total ?? facilities.length;

  const isFiltered = Boolean(
    searchTerm || selectedType || selectedState || districtFilter
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedType("");
    setSelectedState("");
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
        title="FACILITY INTELLIGENCE"
        subtitle="Industrial infrastructure and thermal activity across the monitored region."
        badge={
          <Badge variant="cyan" dot>
            {isLoading ? "Querying..." : `${totalCount} Registered Assets`}
          </Badge>
        }
        breadcrumbs={[
          { label: "AgniDrishti", href: "/command-center" },
          { label: "Facilities" },
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
            {/* Search Input */}
            <div className="relative">
              <Input
                placeholder="Search facility name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-text-muted" />}
                className="font-mono text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Facility Type Filter */}
            <Select
              options={FACILITY_TYPE_OPTIONS}
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* State Filter */}
            <Select
              options={STATE_OPTIONS}
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setOffset(0);
              }}
              className="font-mono text-xs"
            />

            {/* District Filter */}
            <div className="relative">
              <Input
                placeholder="Filter by district..."
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4 text-text-muted" />}
                className="font-mono text-xs"
              />
              {districtFilter && (
                <button
                  type="button"
                  onClick={() => setDistrictFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges & Clear */}
          {isFiltered && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2 text-text-muted">
                <span className="flex items-center gap-1 text-[11px] text-brand-orange uppercase">
                  <Filter className="w-3 h-3" />
                  Active Filters:
                </span>
                {debouncedSearch && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    Name: &quot;{debouncedSearch}&quot;
                  </span>
                )}
                {selectedType && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    Type: {selectedType}
                  </span>
                )}
                {selectedState && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    State: {selectedState}
                  </span>
                )}
                {debouncedDistrict && (
                  <span className="px-2 py-0.5 rounded bg-surface-2 border border-border-subtle text-text-primary text-[11px]">
                    District: {debouncedDistrict}
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
                  <Skeleton className="w-64 h-5 rounded" />
                  <Skeleton className="w-40 h-3 rounded" />
                </div>
                <Skeleton className="w-24 h-6 rounded" />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState
            title="FAILED TO RETRIEVE FACILITY REGISTRY"
            message={error.message || "An unexpected error occurred while communicating with the backend."}
            onRetry={() => refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && facilities.length === 0 && (
          <EmptyState
            title="NO FACILITIES MATCH THE CURRENT FILTERS"
            description={
              isFiltered
                ? "Try broadening your search criteria or resetting filters."
                : "No industrial facilities are currently indexed in the monitored spatial bounds."
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

        {/* Facilities Data Table (Desktop) & Cards (Mobile) */}
        {!isLoading && !error && facilities.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Intelligence Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border-subtle bg-surface-1 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-2/60 text-[10px] font-mono uppercase tracking-wider text-text-muted select-none">
                    <th className="py-3.5 px-4 font-semibold">Facility Identity</th>
                    <th className="py-3.5 px-4 font-semibold">Asset Type</th>
                    <th className="py-3.5 px-4 font-semibold">Administrative Region</th>
                    <th className="py-3.5 px-4 font-semibold">Source</th>
                    <th className="py-3.5 px-4 font-semibold">Last Synced</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Investigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs font-mono">
                  {facilities.map((fac) => (
                    <tr
                      key={fac.id}
                      onClick={() => onNavigate(`/facilities/${fac.id}`)}
                      className="group hover:bg-surface-2/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary font-sans group-hover:text-brand-orange transition-colors">
                          {fac.name}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-text-muted" />
                          <span>OSM #{fac.osm_id || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <FacilityTypeBadge type={fac.facility_type} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-amber shrink-0" />
                          <span>
                            {fac.state || "National"}
                            {fac.district ? `, ${fac.district}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] uppercase text-text-muted">
                          {fac.source || "OSM"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">
                        {fac.last_synced_at
                          ? new Date(fac.last_synced_at).toLocaleDateString()
                          : "Initial Seed"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                          className="text-[11px] group-hover:text-brand-orange"
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Intelligence Cards View */}
            <div className="md:hidden space-y-3">
              {facilities.map((fac) => (
                <Card
                  key={fac.id}
                  onClick={() => onNavigate(`/facilities/${fac.id}`)}
                  className="p-4 space-y-3 cursor-pointer hover:border-brand-orange/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-text-primary font-sans text-sm">
                        {fac.name}
                      </h4>
                      <p className="text-[11px] text-text-muted font-mono mt-0.5">
                        OSM #{fac.osm_id || "N/A"}
                      </p>
                    </div>
                    <FacilityTypeBadge type={fac.facility_type} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs font-mono text-text-secondary">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-amber" />
                      {fac.state || "National"}{fac.district ? `, ${fac.district}` : ""}
                    </span>
                    <span className="text-brand-orange text-[11px] flex items-center">
                      Inspect &rarr;
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
                  {facilities.length === 0 ? 0 : offset + 1}
                </span>{" "}
                to{" "}
                <span className="text-text-primary font-semibold">
                  {Math.min(offset + pageLimit, totalCount)}
                </span>{" "}
                of <span className="text-text-primary font-semibold">{totalCount}</span> facilities
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

