import React from "react";
import { Card, Button, Skeleton, ErrorState } from "../../components/ui";
import { AlertWithDetails } from "../../api/alerts";
import { AlertSeverityBadge, AlertLifecycleBadge } from "../alerts/AlertSeverityBadge";
import { Radio, ArrowRight, ShieldCheck } from "lucide-react";

export interface LiveAlertsPanelProps {
  alerts: AlertWithDetails[];
  isLoading: boolean;
  error: Error | null;
  onSelectAlert: (alert: AlertWithDetails) => void;
  onViewAllAlerts: () => void;
}

export const LiveAlertsPanel: React.FC<LiveAlertsPanelProps> = ({
  alerts,
  isLoading,
  error,
  onSelectAlert,
  onViewAllAlerts,
}) => {
  return (
    <Card className="p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-status-critical animate-pulse" />
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
            Live Threat Alerts
          </h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAllAlerts}
          className="text-[11px] font-mono text-text-muted hover:text-text-primary px-2"
          rightIcon={<ArrowRight className="w-3 h-3" />}
        >
          All Alerts
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="p-3 rounded-lg bg-status-critical/10 border border-status-critical/30 text-xs font-mono text-status-critical">
          Alert stream unavailable.
        </div>
      )}

      {!isLoading && !error && alerts.length === 0 && (
        <div className="p-6 text-center space-y-2 rounded-lg bg-surface-2/40 border border-border-subtle">
          <ShieldCheck className="w-5 h-5 text-status-success mx-auto" />
          <div className="text-xs font-mono text-text-primary font-semibold uppercase">
            No Active Alerts
          </div>
          <p className="text-[11px] font-mono text-text-muted">
            All monitored industrial assets operating within expected baseline.
          </p>
        </div>
      )}

      {!isLoading && !error && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alt) => {
            const isHigh = alt.severity === "high";

            return (
              <div
                key={alt.id}
                onClick={() => onSelectAlert(alt)}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-surface-2 ${
                  isHigh
                    ? "bg-status-critical/5 border-status-critical/30"
                    : "bg-surface-2/60 border-border-subtle"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-primary">
                      ALT-{alt.id.substring(0, 6).toUpperCase()}
                    </span>
                    <AlertSeverityBadge severity={alt.severity} size="sm" />
                  </div>
                  <AlertLifecycleBadge status={alt.status} size="sm" />
                </div>

                {alt.event?.facility_name && (
                  <div className="text-[11px] font-mono text-text-secondary truncate mt-1">
                    Facility: <span className="text-text-primary font-semibold">{alt.event.facility_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mt-1.5 pt-1 border-t border-border-subtle/60">
                  <span>{new Date(alt.sent_at).toLocaleTimeString()}</span>
                  <span className="text-brand-orange hover:underline font-semibold">
                    Triage →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

