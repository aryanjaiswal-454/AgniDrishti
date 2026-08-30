import React from "react";
import { cn } from "../../design-system/utils";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Telemetry Error Encountered",
  message = "Failed to load telemetry or event data from the server.",
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-status-critical/30 bg-status-critical/5 my-4",
        className
      )}
    >
      <div className="mb-3 p-3 rounded-full bg-status-critical/15 text-status-critical border border-status-critical/30">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-display font-semibold text-text-primary">{title}</h4>
      <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};

