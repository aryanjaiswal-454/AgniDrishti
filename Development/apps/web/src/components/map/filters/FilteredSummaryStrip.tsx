import React from "react";
import { Flame, Building2, AlertTriangle, Eye } from "lucide-react";

export interface FilteredSummaryStripProps {
  totalEvents: number;
  anomalousCount: number;
  industrialCount: number;
  facilityCount: number;
  isFiltered: boolean;
}

/**
 * Compact indicator strip showing filtered result counts.
 * Clearly labeled as FILTERED VIEW when filters are active.
 */
export const FilteredSummaryStrip: React.FC<FilteredSummaryStripProps> = ({
  totalEvents,
  anomalousCount,
  industrialCount,
  facilityCount,
  isFiltered,
}) => {
  return (
    <div
      className="flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-2/80 border border-border-subtle text-[11px] font-mono text-text-muted"
      role="status"
      aria-label="Filtered data summary"
    >
      {isFiltered && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-bold text-[10px] uppercase">
          <Eye className="w-3 h-3" />
          Filtered View
        </span>
      )}

      <span className="flex items-center gap-1">
        <Flame className="w-3 h-3 text-brand-orange" />
        <span className="font-bold text-text-primary">{totalEvents}</span>
        Events
      </span>

      <span className="text-border-normal">·</span>

      <span className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-status-critical" />
        <span className={`font-bold ${anomalousCount > 0 ? "text-status-critical" : "text-text-primary"}`}>
          {anomalousCount}
        </span>
        Anomalous
      </span>

      <span className="text-border-normal">·</span>

      <span className="flex items-center gap-1">
        <Flame className="w-3 h-3 text-intelligence-cyan" />
        <span className="font-bold text-text-primary">{industrialCount}</span>
        Industrial
      </span>

      <span className="text-border-normal">·</span>

      <span className="flex items-center gap-1">
        <Building2 className="w-3 h-3 text-intelligence-cyan" />
        <span className="font-bold text-text-primary">{facilityCount}</span>
        Facilities
      </span>
    </div>
  );
};

