import React, { forwardRef } from "react";
import { cn } from "../../design-system/utils";
import { ButtonVariant, ButtonSize } from "./Button";
import { Loader2 } from "lucide-react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: "w-8 h-8 p-1.5",
      md: "w-10 h-10 p-2",
      lg: "w-12 h-12 p-3",
    };

    const variantStyles = {
      primary: "bg-brand-orange text-white hover:bg-brand-orange/90 active:scale-[0.96]",
      secondary: "bg-surface-2 text-text-primary hover:bg-surface-3 border border-border-normal active:scale-[0.96]",
      outline: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-border-subtle active:scale-[0.96]",
      ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface active:scale-[0.96]",
      danger: "bg-status-critical/15 text-status-critical hover:bg-status-critical/25 border border-status-critical/30 active:scale-[0.96]",
      cyan: "bg-intelligence-cyan text-void hover:bg-intelligence-cyan/90 active:scale-[0.96]",
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-50 disabled:cursor-not-allowed",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

