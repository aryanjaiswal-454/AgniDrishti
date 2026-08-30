import React, { forwardRef } from "react";
import { cn } from "../../design-system/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "orange" | "cyan";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = "none", children, ...props }, ref) => {
    const glowStyles = {
      none: "",
      orange: "shadow-brand-glow border-brand-orange/30",
      cyan: "shadow-cyan-glow border-intelligence-cyan/30",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg bg-surface/80 backdrop-blur-md border border-border-subtle/80 p-5 text-text-primary transition-all duration-200",
          glowStyles[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

