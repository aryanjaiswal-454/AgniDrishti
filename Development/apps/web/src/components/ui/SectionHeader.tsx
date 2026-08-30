import React from "react";
import { cn } from "../../design-system/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-border-subtle",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-display font-bold text-text-primary tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
};

