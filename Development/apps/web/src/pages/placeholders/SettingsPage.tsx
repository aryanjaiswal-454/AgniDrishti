import React, { useEffect, useState } from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Input, Select, Button, ErrorState, Skeleton } from "../../components/ui";
import { CheckCircle2, Settings, Save } from "lucide-react";
import { BaseMapLayer } from "../../api/settings";
import { useSystemSettings, useUpdateSystemSettings } from "../../hooks/useSettings";

export const SettingsPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  const { data, isLoading, error, refetch } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const settings = data?.data;
  const [criticalFrp, setCriticalFrp] = useState(150);
  const [anomalyZScore, setAnomalyZScore] = useState(3);
  const [baseLayer, setBaseLayer] = useState<BaseMapLayer>("satellite");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setCriticalFrp(settings.critical_frp_threshold);
    setAnomalyZScore(settings.anomaly_z_score_threshold);
    setBaseLayer(settings.default_map_baselayer);
  }, [settings]);

  const handleSave = async () => {
    setSuccessMessage(null);
    try {
      const result = await updateSettings.mutateAsync({
        critical_frp_threshold: criticalFrp,
        anomaly_z_score_threshold: anomalyZScore,
        default_map_baselayer: baseLayer,
      });
      const counts = result.data.recalculation;
      setSuccessMessage(
        `Saved. Recalculated ${counts.events_reclassified} event(s); created ${counts.alerts_created} alert(s); updated ${counts.alerts_severity_updated} alert severity value(s).`
      );
    } catch {
      // The mutation error is shown next to the form without exposing server details.
    }
  };

  if (isLoading) {
    return <PageContainer><Skeleton className="h-72 max-w-2xl rounded-xl" /></PageContainer>;
  }

  if (error || !settings) {
    return (
      <PageContainer>
        <ErrorState
          title="SETTINGS UNAVAILABLE"
          message={error?.message || "The global analyst policy could not be loaded."}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="System Settings & Preferences"
        subtitle="Global policy: saving recalculates existing events, alert eligibility, map markers, and dashboard KPIs."
        badge={<Badge variant="default">Admin Policy</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Settings" }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-3.5 h-3.5" />}
            isLoading={updateSettings.isPending}
            onClick={handleSave}
          >
            Save & Recalculate
          </Button>
        }
      />

      <Card className="p-6 max-w-2xl space-y-5 bg-surface-1">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <Settings className="w-4 h-4 text-brand-orange" />
          <h4 className="text-sm font-semibold font-display text-text-primary">
            Thermal Anomaly Trigger Thresholds
          </h4>
        </div>

        <Input
          label="CRITICAL FRP THRESHOLD (MW)"
          type="number"
          min="0"
          step="1"
          value={criticalFrp}
          onChange={(event) => setCriticalFrp(Math.max(0, Number(event.target.value) || 0))}
          placeholder="FRP in MW"
        />

        <Input
          label="ANOMALY Z-SCORE THRESHOLD"
          type="number"
          min="0"
          step="0.1"
          value={anomalyZScore}
          onChange={(event) => setAnomalyZScore(Math.max(0, Number(event.target.value) || 0))}
          placeholder="Standard deviations above rolling baseline"
        />

        <Select
          label="DEFAULT MAP BASELAYER"
          value={baseLayer}
          onChange={(event) => setBaseLayer(event.target.value as BaseMapLayer)}
          options={[
            { value: "dark", label: "Dark Canvas" },
            { value: "satellite", label: "ESRI World Imagery (Satellite Optical)" },
            { value: "osm_tactical", label: "OpenStreetMap Standard" },
          ]}
        />

        <p className="rounded-lg border border-border-subtle bg-surface-2 p-3 text-xs font-mono leading-relaxed text-text-secondary">
          Existing event anomaly flags, alert eligibility, map markers, dashboard KPIs, and notifications are recalculated when saved. New telemetry uses the same policy. Existing alert lifecycle states remain under analyst control.
        </p>

        {successMessage && (
          <div role="status" className="flex gap-2 rounded-lg border border-status-success/40 bg-status-success/10 p-3 text-xs font-mono text-status-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {updateSettings.error && (
          <div role="alert" className="rounded-lg border border-status-critical/40 bg-status-critical/10 p-3 text-xs font-mono text-status-critical">
            {(updateSettings.error as any).userFriendlyMessage || (updateSettings.error as Error).message || "Settings could not be saved."}
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
