import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  Building2,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { PageContainer, PageHeader } from "../../components/shell";
import {
  Card,
  Badge,
  Button,
  Select,
  Skeleton,
  ErrorState,
  ConfidenceIndicator,
} from "../../components/ui";
import { useAlerts } from "../../hooks/useAlerts";
import { AlertFilterParams, AlertSeverity, AlertStatus } from "../../api/types";
import { AlertWithDetails } from "../../api/alerts";
import { AlertSeverityBadge, AlertLifecycleBadge } from "./AlertSeverityBadge";
import { EventClassBadge, AnomalyBadge } from "../events/EventClassBadge";
import { AlertDetailDrawer } from "./AlertDetailDrawer";

export interface AlertsPageProps {
  onNavigate: (route: string) => void;
}

const SEVERITY_OPTIONS = [
  { value: "", label: "All Severities" },
  { value: "high", label: "High Priority Only" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low / Informational" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Live Policy Alerts" },
  { value: "", label: "All Statuses (Including History)" },
  { value: "new", label: "New (Unacknowledged)" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "false_positive", label: "False Positive" },
];

const PAGE_SIZE = 25;

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "">("");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "active" | "">("active");
  const [pageOffset, setPageOffset] = useState<number>(0);

  // Selected alert for inspector drawer
  const [selectedAlert, setSelectedAlert] = useState<AlertWithDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const queryParams: AlertFilterParams = useMemo(() => {
    const params: AlertFilterParams = {
      limit: PAGE_SIZE,
      offset: pageOffset,
    };
    if (severityFilter) params.severity = severityFilter;
    if (statusFilter === "active") params.active_only = true;
    else if (statusFilter) params.status = statusFilter;
    return params;
  }, [severityFilter, statusFilter, pageOffset]);

  const { data, isLoading, error, refetch, isFetching } = useAlerts(queryParams);

  const alerts = data?.data || [];
  const totalCount = data?.meta?.total ?? data?.pagination?.total ?? alerts.length;

  const isFiltered = Boolean(severityFilter || (statusFilter && statusFilter !== "active"));

  const handleClearFilters = () => {
    setSeverityFilter("");
    setStatusFilter("active");
    setPageOffset(0);
  };

  const handleOpenDrawer = (alert: AlertWithDetails) => {
    setSelectedAlert(alert);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleAlertUpdated = (updatedAlert: AlertWithDetails) => {
    setSelectedAlert(updatedAlert);
  };

  // KPI Summary calculations derived from returned dataset
  const kpiStats = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    let newCount = 0;
    let ackCount = 0;

    alerts.forEach((alt) => {
      if (alt.severity === "high") high++;
      if (alt.severity === "medium") medium++;
      if (alt.severity === "low") low++;
      if (alt.status === "new") newCount++;
      if (alt.status === "acknowledged") ackCount++;
    });

    return { high, medium, low, newCount, ackCount };
  }, [alerts]);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="ALERT TRIAGE"
        subtitle="Prioritize anomalous thermal events requiring analyst attention."
        badge={
          <Badge variant="critical" dot>
            {isLoading ? "Querying Telemetry..." : `${totalCount} Alerts In Triage`}
          </Badge>
        }
        breadcrumbs={[
          { label: "AgniDrishti", href: "/command-center" },
          { label: "Alert Triage" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* KPI Summary Counter Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="p-3.5 space-y-1 border-l-2 border-l-status-critical">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              High Priority
            </div>
            <div className="text-xl font-mono font-bold text-status-critical">
              {isLoading ? "—" : kpiStats.high}
            </div>
          </Card>

          <Card className="p-3.5 space-y-1 border-l-2 border-l-status-warning">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Medium Priority
            </div>
            <div className="text-xl font-mono font-bold text-status-warning">
              {isLoading ? "—" : kpiStats.medium}
            </div>
          </Card>

          <Card className="p-3.5 space-y-1 border-l-2 border-l-intelligence-cyan">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Low / Info
            </div>
            <div className="text-xl font-mono font-bold text-intelligence-cyan">
              {isLoading ? "—" : kpiStats.low}
            </div>
          </Card>

          <Card className="p-3.5 space-y-1 border-l-2 border-l-brand-orange">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              New / Unack
            </div>
            <div className="text-xl font-mono font-bold text-brand-orange">
              {isLoading ? "—" : kpiStats.newCount}
            </div>
          </Card>

          <Card className="p-3.5 space-y-1 border-l-2 border-l-brand-amber">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Acknowledged
            </div>
            <div className="text-xl font-mono font-bold text-brand-amber">
              {isLoading ? "—" : kpiStats.ackCount}
            </div>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              options={SEVERITY_OPTIONS}
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as AlertSeverity | "");
                setPageOffset(0);
              }}
              className="font-mono text-xs"
            />

            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AlertStatus | "active" | "");
                setPageOffset(0);
              }}
              className="font-mono text-xs"
            />

            {isFiltered && (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<FilterX className="w-3.5 h-3.5" />}
                  onClick={handleClearFilters}
                  className="w-full text-xs font-mono text-text-muted hover:text-text-primary"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState
            title="ALERT TRIAGE TELEMETRY UNAVAILABLE"
            message={error.message || "Failed to retrieve real-time alerts from the intelligence feed."}
            onRetry={() => refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && alerts.length === 0 && (
          <Card className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-surface-2 border border-border-normal flex items-center justify-center text-text-muted">
              <ShieldCheck className="w-6 h-6 text-status-success" />
            </div>
            <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              {isFiltered ? "NO ALERTS MATCH THE CURRENT FILTERS" : "NO ACTIVE ALERTS"}
            </h4>
            <p className="text-xs font-mono text-text-muted max-w-md mx-auto">
              {isFiltered
                ? "No thermal alerts correspond to the active severity or status filters. Reset parameters to view all triage items."
                : "All thermal anomalies are currently triaged or nominal. Monitored assets show no pending critical alerts."}
            </p>
            {isFiltered && (
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Alert Triage Table (Desktop) & Cards (Mobile) */}
        {!isLoading && !error && alerts.length > 0 && (
          <div className="space-y-4">
            {/* Desktop High-Density Table */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-2 border-b border-border-subtle text-text-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Severity & ID</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Anomaly Signal</th>
                    <th className="py-3 px-4">Facility Context</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {alerts.map((alt) => {
                    const isHigh = alt.severity === "high";
                    const isMed = alt.severity === "medium";
                    const event = alt.event;

                    return (
                      <tr
                        key={alt.id}
                        onClick={() => handleOpenDrawer(alt)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-surface-2/80 ${
                          isHigh
                            ? "border-l-4 border-l-status-critical bg-status-critical/5"
                            : isMed
                            ? "border-l-4 border-l-status-warning bg-status-warning/5"
                            : "border-l-4 border-l-intelligence-cyan"
                        }`}
                      >
                        {/* ID & Severity */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">
                              ALT-{alt.id.substring(0, 8).toUpperCase()}
                            </span>
                            <AlertSeverityBadge severity={alt.severity} size="sm" />
                          </div>
                        </td>

                        {/* Classification */}
                        <td className="py-3.5 px-4">
                          <EventClassBadge
                            primaryClass={event?.primary_class}
                            subClass={event?.sub_class}
                            size="sm"
                          />
                        </td>

                        {/* Anomaly & Confidence */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <AnomalyBadge isAnomalous={Boolean(event?.is_anomalous)} size="sm" />
                            {event?.confidence_score !== undefined && (
                              <ConfidenceIndicator score={event.confidence_score} size="sm" />
                            )}
                          </div>
                        </td>

                        {/* Facility Context */}
                        <td className="py-3.5 px-4">
                          {event?.facility_name ? (
                            <span className="text-text-primary font-semibold truncate max-w-[180px] block">
                              {event.facility_name}
                            </span>
                          ) : (
                            <span className="text-text-muted text-[11px]">Natural / Buffer</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-text-muted text-[11px] whitespace-nowrap">
                          {new Date(alt.sent_at).toLocaleString()}
                        </td>

                        {/* Lifecycle Status */}
                        <td className="py-3.5 px-4">
                          <AlertLifecycleBadge status={alt.status} size="sm" />
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(alt);
                            }}
                          >
                            Triage →
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Tactical Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {alerts.map((alt) => {
                const isHigh = alt.severity === "high";
                const isMed = alt.severity === "medium";
                const event = alt.event;

                return (
                  <Card
                    key={alt.id}
                    onClick={() => handleOpenDrawer(alt)}
                    className={`p-4 space-y-3 cursor-pointer ${
                      isHigh
                        ? "border-l-4 border-l-status-critical"
                        : isMed
                        ? "border-l-4 border-l-status-warning"
                        : "border-l-4 border-l-intelligence-cyan"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        ALT-{alt.id.substring(0, 8).toUpperCase()}
                      </span>
                      <AlertSeverityBadge severity={alt.severity} size="sm" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <EventClassBadge
                        primaryClass={event?.primary_class}
                        subClass={event?.sub_class}
                        size="sm"
                      />
                      <AnomalyBadge isAnomalous={Boolean(event?.is_anomalous)} size="sm" />
                      <AlertLifecycleBadge status={alt.status} size="sm" />
                    </div>

                    {event?.facility_name && (
                      <div className="text-xs font-mono text-text-secondary">
                        Facility: <span className="text-text-primary font-semibold">{event.facility_name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] font-mono text-text-muted">
                      <span>{new Date(alt.sent_at).toLocaleTimeString()}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(alt);
                        }}
                      >
                        Triage →
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 font-mono text-xs text-text-muted">
              <div>
                Showing {pageOffset + 1} to {Math.min(pageOffset + PAGE_SIZE, totalCount)} of {totalCount} alerts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageOffset === 0}
                  onClick={() => setPageOffset(Math.max(0, pageOffset - PAGE_SIZE))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageOffset + PAGE_SIZE >= totalCount}
                  onClick={() => setPageOffset(pageOffset + PAGE_SIZE)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert Investigation Inspector Drawer */}
      <AlertDetailDrawer
        alert={selectedAlert}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onNavigate={onNavigate}
        onAlertUpdated={handleAlertUpdated}
      />
    </PageContainer>
  );
};

