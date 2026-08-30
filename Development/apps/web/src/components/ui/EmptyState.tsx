import React from "react";
import { cn } from "../../design-system/utils";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-10 h-10 text-text-muted" />,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border-subtle bg-surface/50 my-4",
        className
      )}
    >
      <div className="mb-3 p-3 rounded-full bg-surface-2 border border-border-normal">{icon}</div>
      <h4 className="text-base font-display font-semibold text-text-primary">{title}</h4>
      {description && (
        <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

