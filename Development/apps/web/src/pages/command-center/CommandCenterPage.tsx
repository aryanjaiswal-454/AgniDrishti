import React, { useState } from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Badge, Button, ErrorState } from "../../components/ui";
import { useDashboardSummary } from "../../hooks/useDashboard";
import { useEvents } from "../../hooks/useEvents";
import { useFacilities } from "../../hooks/useFacilities";
import { useAlerts } from "../../hooks/useAlerts";
import { AlertWithDetails } from "../../api/alerts";
import { CommandCenterKpis } from "./CommandCenterKpis";
import { CommandCenterMap } from "./CommandCenterMap";
import { LiveAlertsPanel } from "./LiveAlertsPanel";
import { RecentEventsPanel } from "./RecentEventsPanel";
import { AiIntelligencePanel } from "./AiIntelligencePanel";
import { IngestionStatusPanel } from "./IngestionStatusPanel";
import { AlertDetailDrawer } from "../alerts/AlertDetailDrawer";
import { RefreshCw, Radio, Flame, Layers } from "lucide-react";

export interface CommandCenterPageProps {
  onNavigate: (route: string) => void;
}

export const CommandCenterPage: React.FC<CommandCenterPageProps> = ({ onNavigate }) => {
  const [anomaliesOnly, setAnomaliesOnly] = useState<boolean>(false);

  // Selected alert for triage drawer
  const [selectedAlert, setSelectedAlert] = useState<AlertWithDetails | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);

  // Queries
  const {
    data: summaryRes,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
    isFetching: isSummaryFetching,
  } = useDashboardSummary();

  const {
    data: eventsRes,
    isLoading: isEventsLoading,
    refetch: refetchEvents,
  } = useEvents({ limit: 50 });

  const {
    data: facilitiesRes,
    isLoading: isFacilitiesLoading,
    refetch: refetchFacilities,
  } = useFacilities({ limit: 50 });

  const {
    data: alertsRes,
    isLoading: isAlertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts({ limit: 4 });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchEvents();
    refetchFacilities();
    refetchAlerts();
  };

  const handleSelectAlert = (alert: AlertWithDetails) => {
    setSelectedAlert(alert);
    setIsAlertDrawerOpen(true);
  };

  const summary = summaryRes?.data;
  const events = eventsRes?.data || [];
  const facilities = facilitiesRes?.data || [];
  const alerts = alertsRes?.data || [];

  const recentEvents = summary?.recent_events || events.map((e) => ({
    id: e.id,
    primary_class: e.primary_class,
    sub_class: e.sub_class,
    facility_name: e.facility?.name || null,
    latitude: e.hotspot?.latitude || 0,
    longitude: e.hotspot?.longitude || 0,
    frp: e.hotspot?.frp || null,
    confidence_score: e.confidence_score,
    is_anomalous: e.is_anomalous,
    created_at: e.created_at,
  }));

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="COMMAND CENTER"
        subtitle="Operational overview of thermal events, industrial activity and emerging anomalies."
        badge={
          <Badge variant="brand" dot>
            {isSummaryLoading ? "Syncing Telemetry..." : "PIPELINE OPERATIONAL"}
          </Badge>
        }
        breadcrumbs={[
          { label: "AgniDrishti", href: "/command-center" },
          { label: "Command Center" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-2 rounded-md border border-border-normal p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setAnomaliesOnly(false)}
                className={`px-2.5 py-1 rounded transition-all ${
                  !anomaliesOnly
                    ? "bg-surface-3 text-text-primary font-bold shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                All Detections
              </button>
              <button
                type="button"
                onClick={() => setAnomaliesOnly(true)}
                className={`px-2.5 py-1 rounded transition-all ${
                  anomaliesOnly
                    ? "bg-status-critical/20 text-status-critical font-bold border border-status-critical/30 shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Anomalies Only
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSummaryFetching ? "animate-spin" : ""}`} />}
              onClick={handleRefreshAll}
              disabled={isSummaryFetching}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Top KPI Metrics Strip */}
        <CommandCenterKpis summary={summary} isLoading={isSummaryLoading} />

        {/* Central Operational Grid: Map (~65%) + Intelligence Panels (~35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Geospatial Surface */}
          <div className="lg:col-span-8 space-y-4">
            <CommandCenterMap
              events={events}
              facilities={facilities}
              isLoading={isEventsLoading || isFacilitiesLoading}
              onNavigate={onNavigate}
              anomaliesOnlyFilter={anomaliesOnly}
            />

            {/* AI Intelligence Summary below map on desktop */}
            <AiIntelligencePanel
              breakdown={summary?.breakdown_by_class || []}
              anomalousCount={summary?.metrics?.anomalous_events_count || 0}
              totalCount={summary?.metrics?.total_classified_events || events.length}
              isLoading={isSummaryLoading}
            />
          </div>

          {/* Right Side Intelligence & Alert Stack */}
          <div className="lg:col-span-4 space-y-5">
            {/* Live Alerts Panel */}
            <LiveAlertsPanel
              alerts={alerts}
              isLoading={isAlertsLoading}
              error={alertsError}
              onSelectAlert={handleSelectAlert}
              onViewAllAlerts={() => onNavigate("/alerts")}
            />

            {/* Recent Classified Thermal Events */}
            <RecentEventsPanel
              events={recentEvents}
              isLoading={isSummaryLoading && isEventsLoading}
              onNavigate={onNavigate}
            />

            {/* Telemetry Pipeline Ingestion Status */}
            <IngestionStatusPanel />
          </div>
        </div>
      </div>

      {/* Alert Investigation Inspector Drawer */}
      <AlertDetailDrawer
        alert={selectedAlert}
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        onNavigate={onNavigate}
      />
    </PageContainer>
  );
};

