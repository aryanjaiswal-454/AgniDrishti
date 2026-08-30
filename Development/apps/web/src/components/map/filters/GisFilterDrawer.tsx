import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GisFilterState,
  TimePreset,
  AnomalyMode,
  TIME_PRESETS,
  getConstrainedSubClasses,
} from "./gisFilterState";
import { PrimaryClass, SubClass } from "../../../api/types";
import {
  Filter,
  X,
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ChevronDown,
} from "lucide-react";

export interface GisFilterDrawerProps {
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
 * Mobile/tablet GIS filter drawer.
 * Triggered by a floating Filters button when viewport < lg.
 */
export const GisFilterDrawer: React.FC<GisFilterDrawerProps> = ({
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
  const [isOpen, setIsOpen] = useState(false);
  const subClassOptions = getConstrainedSubClasses(filters.primaryClass);

  return (
    <div className="lg:hidden">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-xs font-mono font-medium text-text-primary shadow-sm hover:bg-surface-2 transition-all"
        aria-label="Open GIS Filters"
      >
        <Filter className="w-3.5 h-3.5 text-brand-orange" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange font-bold text-[10px]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Drawer Overlay + Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[2001] max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface border-t border-border-normal shadow-2xl"
              role="dialog"
              aria-label="GIS Intelligence Filters"
            >
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between px-5 py-3 bg-surface border-b border-border-subtle z-10">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-text-primary uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-brand-orange" />
                  Intelligence Filters
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5 text-xs font-mono">
                {/* ─── Temporal ─── */}
                <div role="group" aria-label="Time Range">
                  <label className="flex items-center gap-1.5 text-[11px] uppercase text-text-secondary font-bold mb-2">
                    <Clock className="w-3.5 h-3.5" /> Time Range
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => onSetDateRange(preset.value)}
                        aria-pressed={filters.dateRange === preset.value}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                          filters.dateRange === preset.value
                            ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
                            : "bg-surface-2 text-text-muted border border-transparent"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onSetDateRange("custom")}
                      aria-pressed={filters.dateRange === "custom"}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                        filters.dateRange === "custom"
                          ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
                          : "bg-surface-2 text-text-muted border border-transparent"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {filters.dateRange === "custom" && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="date"
                        value={filters.dateFrom || ""}
                        onChange={(e) => onSetDateFrom(e.target.value || null)}
                        aria-label="Start date"
                        className="flex-1 px-2 py-1.5 rounded-md text-[11px] bg-surface-2 border border-border-normal text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                      <span className="text-text-muted self-center">→</span>
                      <input
                        type="date"
                        value={filters.dateTo || ""}
                        onChange={(e) => onSetDateTo(e.target.value || null)}
                        aria-label="End date"
                        className="flex-1 px-2 py-1.5 rounded-md text-[11px] bg-surface-2 border border-border-normal text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                  )}
                </div>

                {/* ─── Classification ─── */}
                <div role="group" aria-label="Classification">
                  <label className="flex items-center gap-1.5 text-[11px] uppercase text-text-secondary font-bold mb-2">
                    <Layers className="w-3.5 h-3.5" /> Classification
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(["", "industrial", "natural"] as const).map((cls) => (
                      <button
                        key={cls || "all-class"}
                        type="button"
                        onClick={() => onSetPrimaryClass(cls)}
                        aria-pressed={filters.primaryClass === cls}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                          filters.primaryClass === cls
                            ? "bg-intelligence-cyan/20 text-intelligence-cyan border border-intelligence-cyan/40 font-bold"
                            : "bg-surface-2 text-text-muted border border-transparent"
                        }`}
                      >
                        {cls === "" ? "All" : cls === "industrial" ? "Industrial" : "Natural"}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <select
                      value={filters.subClass}
                      onChange={(e) => onSetSubClass(e.target.value as "" | SubClass)}
                      aria-label="Sub-classification"
                      className="appearance-none w-full pl-3 pr-8 py-1.5 rounded-md text-[11px] bg-surface-2 border border-border-normal text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    >
                      {subClassOptions.map((opt) => (
                        <option key={opt.value || "all-sub"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* ─── Confidence ─── */}
                <div role="group" aria-label="Minimum AI Confidence">
                  <label className="flex items-center gap-1.5 text-[11px] uppercase text-text-secondary font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Minimum AI Confidence
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONFIDENCE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onSetMinConfidence(preset.value)}
                        aria-pressed={filters.minConfidence === preset.value}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                          filters.minConfidence === preset.value
                            ? "bg-status-success/20 text-status-success border border-status-success/40 font-bold"
                            : "bg-surface-2 text-text-muted border border-transparent"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Anomaly ─── */}
                <div role="group" aria-label="Anomaly Filter">
                  <label className="flex items-center gap-1.5 text-[11px] uppercase text-text-secondary font-bold mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Anomaly State
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "anomalous", "nominal"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onSetAnomalyMode(mode)}
                        aria-pressed={filters.anomalyMode === mode}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                          filters.anomalyMode === mode
                            ? mode === "anomalous"
                              ? "bg-status-critical/20 text-status-critical border border-status-critical/40 font-bold"
                              : "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
                            : "bg-surface-2 text-text-muted border border-transparent"
                        }`}
                      >
                        {mode === "all" ? "All Events" : mode === "anomalous" ? "Anomalous Only" : "Nominal Only"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Region ─── */}
                <div role="group" aria-label="Geographic Region">
                  <label className="flex items-center gap-1.5 text-[11px] uppercase text-text-secondary font-bold mb-2">
                    <MapPin className="w-3.5 h-3.5" /> Geographic Region
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={filters.state}
                      onChange={(e) => onSetState(e.target.value)}
                      placeholder="State"
                      aria-label="State filter"
                      className="flex-1 px-3 py-1.5 rounded-md text-[11px] bg-surface-2 border border-border-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                    <input
                      type="text"
                      value={filters.district}
                      onChange={(e) => onSetDistrict(e.target.value)}
                      placeholder="District"
                      aria-label="District filter"
                      className="flex-1 px-3 py-1.5 rounded-md text-[11px] bg-surface-2 border border-border-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                {/* ─── Actions ─── */}
                <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="flex-1 px-3 py-2 rounded-lg text-xs bg-surface-3 text-status-critical border border-status-critical/30 hover:bg-status-critical/10 flex items-center justify-center gap-1.5 transition-all font-medium"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear All Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs bg-brand-orange text-white font-bold hover:bg-brand-orange/90 transition-all"
                  >
                    Apply & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

