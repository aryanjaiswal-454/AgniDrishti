import React from "react";
import { X } from "lucide-react";
import { ActiveFilterDescriptor, GisFilterState } from "./gisFilterState";

export interface ActiveFilterChipsProps {
  descriptors: ActiveFilterDescriptor[];
  onClearFilter: (key: keyof GisFilterState) => void;
  onClearAll: () => void;
}

/**
 * Compact row of dismissible active filter chips.
 * Renders below the filter bar to show what filters are currently applied.
 */
export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  descriptors,
  onClearFilter,
  onClearAll,
}) => {
  if (descriptors.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono" role="status" aria-label="Active filters">
      <span className="text-text-muted uppercase text-[10px] font-bold select-none mr-0.5">
        Active:
      </span>
      {descriptors.map((desc) => (
        <span
          key={desc.key}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 font-medium"
        >
          {desc.label}
          <button
            type="button"
            onClick={() => onClearFilter(desc.key)}
            className="hover:text-white transition-colors"
            aria-label={`Remove ${desc.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="px-2 py-0.5 rounded-full text-[10px] text-status-critical border border-status-critical/20 hover:bg-status-critical/10 transition-all font-medium"
      >
        Clear All
      </button>
    </div>
  );
};

