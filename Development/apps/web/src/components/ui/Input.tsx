import React, { forwardRef } from "react";
import { cn } from "../../design-system/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-mono font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-text-muted pointer-events-none">{leftIcon}</span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full bg-surface-2 text-text-primary text-sm rounded-md border border-border-normal px-3 py-2 transition-colors duration-150",
              "placeholder:text-text-muted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-status-critical focus:border-status-critical focus:ring-status-critical",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-text-muted">{rightIcon}</span>
          )}
        </div>
        {error && <span className="text-xs text-status-critical font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

