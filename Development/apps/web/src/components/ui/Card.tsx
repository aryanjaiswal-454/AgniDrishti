import React, { forwardRef } from "react";
import { cn } from "../../design-system/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "surface-2" | "surface-3" | "interactive";
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hoverable = false, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-surface border-border-subtle",
      "surface-2": "bg-surface-2 border-border-normal",
      "surface-3": "bg-surface-3 border-border-normal",
      interactive:
        "bg-surface border-border-subtle hover:border-brand-orange/40 hover:bg-surface-2 cursor-pointer",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border p-5 transition-all duration-200 text-text-primary",
          variantStyles[variant],
          hoverable && "hover:border-border-normal hover:-translate-y-0.5 shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

