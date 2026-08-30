import React, { forwardRef } from "react";
import { cn } from "../../design-system/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-mono font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full appearance-none bg-surface-2 text-text-primary text-sm rounded-md border border-border-normal px-3 py-2 pr-9 transition-colors duration-150",
              "focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange",
              "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
              error && "border-status-critical focus:border-status-critical focus:ring-status-critical",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface-2 text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 pointer-events-none" />
        </div>
        {error && <span className="text-xs text-status-critical font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";

