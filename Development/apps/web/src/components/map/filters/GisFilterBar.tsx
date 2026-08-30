import React from "react";
import {
  GisFilterState,
  TimePreset,
  AnomalyMode,
  TIME_PRESETS,
  getConstrainedSubClasses,
} from "./gisFilterState";
import { PrimaryClass, SubClass } from "../../../api/types";
import {
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";

export interface GisFilterBarProps {
  filters: GisFilterState;
  onSetDateRange: (preset: TimePreset) => void;
  onSetDateFrom: (date: string | null) => void;
  onSetDateTo: (date: string | null) => void;
  onSetPrimaryClass: (value: "" | PrimaryClass) => void;
  onSetSubClass: (value: "" | SubClass) => void;
  onSetMinConfidence: (value: number | null) => void;
  onSetAnomalyMode: (mode: AnomalyMode) => void;
  onSetState: (value: string) => void;
  onSetDistrict: (value: string) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const CONFIDENCE_PRESETS: { value: number | null; label: string }[] = [
  { value: null, label: "All" },
  { value: 0.7, label: "≥70%" },
  { value: 0.8, label: "≥80%" },
  { value: 0.9, label: "≥90%" },
];

/**
 * Compact horizontal GIS filter bar for desktop viewports.
 * Renders as a professional analyst toolbar above the map.
 */
export const GisFilterBar: React.FC<GisFilterBarProps> = ({
  filters,
  onSetDateRange,
  onSetDateFrom,
  onSetDateTo,
  onSetPrimaryClass,
  onSetSubClass,
  onSetMinConfidence,
  onSetAnomalyMode,
  onSetState,
  onSetDistrict,
  onReset,
  activeFilterCount,
}) => {
  const subClassOptions = getConstrainedSubClasses(filters.primaryClass);

  return (
    <div className="hidden lg:block" role="toolbar" aria-label="GIS Intelligence Filters">
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-surface-1 border border-border-subtle shadow-sm text-xs font-mono">
        {/* Filter Icon Header */}
        <div className="flex items-center gap-1.5 px-2 text-text-muted text-[11px] uppercase border-r border-border-subtle mr-0.5 select-none">
          <Filter className="w-3.5 h-3.5 text-brand-orange" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange font-bold text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* ─── Temporal ─── */}
        <div className="flex items-center gap-1 border-r border-border-subtle pr-1.5" role="group" aria-label="Time Range">
          <Clock className="w-3 h-3 text-text-muted flex-shrink-0" />
          {TIME_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onSetDateRange(preset.value)}
              aria-pressed={filters.dateRange === preset.value}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                filters.dateRange === preset.value
                  ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
                  : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              {preset.label}
            </button>
          ))}
          {/* Custom date range inputs — shown inline when custom is active */}
          <button
            type="button"
            onClick={() => onSetDateRange("custom")}
            aria-pressed={filters.dateRange === "custom"}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
              filters.dateRange === "custom"
                ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
                : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary hover:bg-surface-3"
            }`}
          >
            Custom
          </button>
          {filters.dateRange === "custom" && (
            <>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => onSetDateFrom(e.target.value || null)}
                aria-label="Start date"
                className="px-1.5 py-0.5 rounded text-[11px] bg-surface-2 border border-border-normal text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-orange w-[110px]"
              />
              <span className="text-text-muted">→</span>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => onSetDateTo(e.target.value || null)}
                aria-label="End date"
                className="px-1.5 py-0.5 rounded text-[11px] bg-surface-2 border border-border-normal text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-orange w-[110px]"
              />
            </>
          )}
        </div>

        {/* ─── Classification ─── */}
        <div className="flex items-center gap-1 border-r border-border-subtle pr-1.5" role="group" aria-label="Classification">
          <Layers className="w-3 h-3 text-text-muted flex-shrink-0" />
          {(["", "industrial", "natural"] as const).map((cls) => (
            <button
              key={cls || "all-class"}
              type="button"
              onClick={() => onSetPrimaryClass(cls)}
              aria-pressed={filters.primaryClass === cls}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                filters.primaryClass === cls
                  ? "bg-intelligence-cyan/20 text-intelligence-cyan border border-intelligence-cyan/40 font-bold"
                  : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              {cls === "" ? "All" : cls === "industrial" ? "Industrial" : "Natural"}
            </button>
          ))}
          {/* Sub-class dropdown */}
          <div className="relative">
            <select
              value={filters.subClass}
              onChange={(e) => onSetSubClass(e.target.value as "" | SubClass)}
              aria-label="Sub-classification"
              className="appearance-none pl-2 pr-6 py-1 rounded text-[11px] bg-surface-2 border border-border-normal text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-orange"
            >
              {subClassOptions.map((opt) => (
                <option key={opt.value || "all-sub"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* ─── Confidence ─── */}
        <div className="flex items-center gap-1 border-r border-border-subtle pr-1.5" role="group" aria-label="Minimum AI Confidence">
          <ShieldCheck className="w-3 h-3 text-text-muted flex-shrink-0" />
          {CONFIDENCE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSetMinConfidence(preset.value)}
              aria-pressed={filters.minConfidence === preset.value}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                filters.minConfidence === preset.value
                  ? "bg-status-success/20 text-status-success border border-status-success/40 font-bold"
                  : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* ─── Anomaly ─── */}
        <div className="flex items-center gap-1 border-r border-border-subtle pr-1.5" role="group" aria-label="Anomaly Filter">
          <AlertTriangle className="w-3 h-3 text-text-muted flex-shrink-0" />
          {(["all", "anomalous", "nominal"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSetAnomalyMode(mode)}
              aria-pressed={filters.anomalyMode === mode}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                filters.anomalyMode === mode
                  ? mode === "anomalous"
                    ? "bg-status-critical/20 text-status-critical border border-status-critical/40 font-bold"
                    : "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
                  : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              {mode === "all" ? "All" : mode === "anomalous" ? "Anomalous" : "Nominal"}
            </button>
          ))}
        </div>

        {/* ─── Region ─── */}
        <div className="flex items-center gap-1" role="group" aria-label="Geographic Region">
          <MapPin className="w-3 h-3 text-text-muted flex-shrink-0" />
          <input
            type="text"
            value={filters.state}
            onChange={(e) => onSetState(e.target.value)}
            placeholder="State"
            aria-label="State filter"
            className="px-2 py-1 rounded text-[11px] bg-surface-2 border border-border-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-orange w-[90px]"
          />
          <input
            type="text"
            value={filters.district}
            onChange={(e) => onSetDistrict(e.target.value)}
            placeholder="District"
            aria-label="District filter"
            className="px-2 py-1 rounded text-[11px] bg-surface-2 border border-border-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-orange w-[90px]"
          />
        </div>

        {/* ─── Clear All ─── */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="ml-1 px-2.5 py-1 rounded text-[11px] bg-surface-3 text-status-critical border border-status-critical/30 hover:bg-status-critical/10 flex items-center gap-1 transition-all font-medium"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

