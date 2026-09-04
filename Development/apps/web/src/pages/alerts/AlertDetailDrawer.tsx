import React, { useEffect, useState } from "react";
import { Drawer, Button, ConfidenceIndicator, Modal } from "../../components/ui";
import { AlertWithDetails } from "../../api/alerts";
import { AlertSeverityBadge, AlertLifecycleBadge } from "./AlertSeverityBadge";
import { EventClassBadge, AnomalyBadge } from "../events/EventClassBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUpdateAlertStatus } from "../../hooks/useAlerts";
import {
  Flame,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";

export interface AlertDetailDrawerProps {
  alert: AlertWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onAlertUpdated?: (alert: AlertWithDetails) => void;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  alert,
  isOpen,
  onClose,
  onNavigate,
  onAlertUpdated,
}) => {
  const { user } = useCurrentUser();
  const updateStatusMutation = useUpdateAlertStatus();

  // Confirmation modal state for destructive transitions (resolve / false positive)
  const [confirmAction, setConfirmAction] = useState<"resolved" | "false_positive" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmAction(null);
    setActionError(null);
  }, [alert?.id, isOpen]);

  if (!alert) return null;

  const isAnalystOrAdmin = user?.role === "admin" || user?.role === "analyst";
  const event = alert.event;

  const handleAction = async (status: "acknowledged" | "resolved" | "false_positive") => {
    try {
      setActionError(null);
      const result = await updateStatusMutation.mutateAsync({
        id: alert.id,
        status,
      });
      onAlertUpdated?.({
        ...alert,
        status: result.data.status,
        acknowledged_by: result.data.acknowledged_by,
        acknowledged_by_name: user?.name || alert.acknowledged_by_name,
      });
      setConfirmAction(null);
    } catch (err: any) {
      console.error("Failed to update alert status:", err);
      setActionError(err?.userFriendlyMessage || err?.message || "The alert status could not be updated. Please try again.");
    }
  };

  const coordinates = event?.latitude && event?.longitude
    ? `${event.latitude.toFixed(4)}° N, ${event.longitude.toFixed(4)}° E`
    : "Coordinates not recorded";

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="lg"
        title={`ALERT ALT-${alert.id.substring(0, 8).toUpperCase()}`}
        description={`Reported ${new Date(alert.sent_at).toLocaleString()}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
            {event?.id && (
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => {
                  onClose();
                  onNavigate(`/events/${event.id}`);
                }}
              >
                Full Event Investigation
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6 pt-2 pb-4">
          {/* Header Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-lg bg-surface-1 border border-border-subtle">
            <div className="flex items-center gap-2">
              <AlertSeverityBadge severity={alert.severity} size="md" />
              <AlertLifecycleBadge status={alert.status} size="md" />
            </div>
            <div className="text-[11px] font-mono text-text-muted">
              UUID: {alert.id.substring(0, 13)}...
            </div>
          </div>

          {/* Section 1: Lifecycle & Analyst Actions */}
          <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-amber" />
                Operational Triage Actions
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {isAnalystOrAdmin ? "Analyst Authorized" : "Read-Only Observer"}
              </span>
            </div>

            {isAnalystOrAdmin && (alert.status === "new" || alert.status === "acknowledged") ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {alert.status === "new" && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Clock className="w-3.5 h-3.5" />}
                      isLoading={updateStatusMutation.isPending}
                      onClick={() => handleAction("acknowledged")}
                    >
                      Acknowledge Alert
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-status-success" />}
                    isLoading={updateStatusMutation.isPending}
                    onClick={() => setConfirmAction("resolved")}
                  >
                    Resolve Incident
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<XCircle className="w-3.5 h-3.5 text-text-muted" />}
                    isLoading={updateStatusMutation.isPending}
                    onClick={() => setConfirmAction("false_positive")}
                  >
                    Mark False Positive
                  </Button>
                </div>

                {actionError && (
                  <div role="alert" className="rounded border border-status-critical/40 bg-status-critical/10 px-2.5 py-2 text-[11px] font-mono text-status-critical">
                    {actionError}
                  </div>
                )}

                {alert.acknowledged_by_name && (
                  <div className="text-[11px] font-mono text-text-muted pt-1">
                    Acknowledged by: <span className="text-text-primary font-semibold">{alert.acknowledged_by_name}</span>
                  </div>
                )}
              </div>
            ) : isAnalystOrAdmin ? (
              <div className="p-2.5 rounded bg-surface-2 text-xs font-mono text-text-muted">
                This alert is closed as {alert.status === "resolved" ? "resolved" : "a false positive"}. No further triage action is available.
              </div>
            ) : (
              <div className="p-2.5 rounded bg-surface-2 text-xs font-mono text-text-muted">
                Alert triage mutations and lifecycle actions are restricted to Analyst and Admin roles.
              </div>
            )}
          </div>

          {/* Section 2: Related Classified Event */}
          <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-3.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-brand-orange" />
                Linked Thermal Anomaly
              </div>
              {event?.id && (
                <span className="text-[11px] font-mono text-intelligence-cyan">
                  EVT-{event.id.substring(0, 8).toUpperCase()}
                </span>
              )}
            </div>

            {event ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Classification:</span>
                  <EventClassBadge primaryClass={event.primary_class} subClass={event.sub_class} size="sm" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Anomaly Signal:</span>
                  <AnomalyBadge isAnomalous={Boolean(event.is_anomalous)} size="sm" />
                </div>

                {event.confidence_score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">AI Confidence:</span>
                    <ConfidenceIndicator score={event.confidence_score} size="sm" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Radiative Power (FRP):</span>
                  <span className="text-brand-orange font-bold">
                    {event.frp ? `${event.frp} MW` : "Telemetry unavailable"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Coordinates:</span>
                  <span className="text-text-primary flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-amber shrink-0" />
                    <span>{coordinates}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-text-muted">
                Classified event telemetry record not currently linked.
              </div>
            )}
          </div>

          {/* Section 3: Facility Context */}
          <div className="p-4 rounded-lg bg-surface-1 border border-border-subtle space-y-3">
            <div className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-amber" />
              Spatial Infrastructure Context
            </div>

            {event?.facility_name ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-text-primary font-bold">{event.facility_name}</div>
                <div className="text-text-muted text-[11px]">
                  Detected within monitored buffer zone of industrial asset.
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-text-muted">
                No registered industrial infrastructure intersects the 5 km association range.
              </div>
            )}
          </div>

          {/* Section 4: Audit & Status History */}
          <div className="p-3.5 rounded-lg bg-surface-1 border border-border-subtle space-y-2 text-xs font-mono">
            <div className="text-[10px] uppercase text-text-muted">Status History & Audit</div>
            <div className="text-text-muted text-[11px]">
              {alert.acknowledged_by_name
                ? `Acknowledged by ${alert.acknowledged_by_name}.`
                : "Status history unavailable (single transition audit state)."}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Confirmation Modal for Resolve / False Positive */}
      <Modal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "resolved"
            ? "Resolve Thermal Alert?"
            : "Mark as False Positive?"
        }
        description={
          confirmAction === "resolved"
            ? "Confirming resolution indicates the thermal incident has been inspected or managed. This will update operational alert metrics."
            : "Marking this as a false positive will clear the active alert and log the telemetry for classification tuning."
        }
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmAction(null)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === "resolved" ? "primary" : "secondary"}
              size="sm"
              isLoading={updateStatusMutation.isPending}
              onClick={() => confirmAction && handleAction(confirmAction)}
            >
              {confirmAction === "resolved" ? "Confirm Resolve" : "Confirm False Positive"}
            </Button>
          </div>
        }
      >
        <div className="py-2 text-xs font-mono text-text-secondary">
          Alert ALT-{alert.id.substring(0, 8).toUpperCase()} • Severity: {alert.severity.toUpperCase()}
        </div>
      </Modal>
    </>
  );
};

