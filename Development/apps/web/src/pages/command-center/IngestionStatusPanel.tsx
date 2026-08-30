import React from "react";
import { Card, Badge, Button } from "../../components/ui";
import { useIngestionStatus, useTriggerFirms, useTriggerOsm } from "../../hooks/useIngestion";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { Database, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export const IngestionStatusPanel: React.FC = () => {
  const { user } = useCurrentUser();
  const { data: statusRes, isLoading, error, refetch, isFetching } = useIngestionStatus();
  const firmsMutation = useTriggerFirms();
  const osmMutation = useTriggerOsm();

  const isAdmin = user?.role === "admin";
  const status = statusRes?.data;

  return (
    <Card className="p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-intelligence-cyan" />
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
            Telemetry Pipeline Status
          </h4>
        </div>
        <Badge variant={error ? "critical" : "brand"} size="sm">
          {isLoading ? "Querying..." : error ? "Degraded" : "Active Ingestion"}
        </Badge>
      </div>

      <div className="space-y-2.5 text-xs font-mono">
        {/* FIRMS NRT Status */}
        <div className="p-2.5 rounded bg-surface-2 border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-text-primary font-semibold text-[11px]">NASA FIRMS NRT Stream</div>
            <div className="text-text-muted text-[10px]">
              Last Ingestion: {status?.firms?.last_ingestion ? new Date(status.firms.last_ingestion).toLocaleTimeString() : "Recent pass"}
            </div>
          </div>
          <Badge variant="success" size="sm">
            {status?.firms?.status ? status.firms.status.toUpperCase() : "CONNECTED"}
          </Badge>
        </div>

        {/* OSM Sync Status */}
        <div className="p-2.5 rounded bg-surface-2 border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-text-primary font-semibold text-[11px]">OpenStreetMap Vectors</div>
            <div className="text-text-muted text-[10px]">
              Last Sync: {status?.osm?.last_sync ? new Date(status.osm.last_sync).toLocaleTimeString() : "Cached registry"}
            </div>
          </div>
          <Badge variant="cyan" size="sm">
            {status?.osm?.status ? status.osm.status.toUpperCase() : "SYNCED"}
          </Badge>
        </div>

        {/* Admin Quick Sync Controls */}
        {isAdmin && (
          <div className="pt-1 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 text-[11px]"
              isLoading={firmsMutation.isPending}
              onClick={() => firmsMutation.mutate(true)}
            >
              Sync FIRMS NRT
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 text-[11px]"
              isLoading={osmMutation.isPending}
              onClick={() => osmMutation.mutate(true)}
            >
              Sync OSM
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

