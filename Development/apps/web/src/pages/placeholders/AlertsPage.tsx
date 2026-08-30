import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button } from "../../components/ui";
import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";

export const AlertsPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Real-Time Threat Alerts"
        subtitle="Active anomalous fire detections requiring analyst triage and authority escalation."
        badge={<Badge variant="critical" dot>2 Unacknowledged</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Alerts" }]}
        actions={
          <Button variant="secondary" size="sm" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            Acknowledge All
          </Button>
        }
      />

      <div className="space-y-3">
        <Card className="p-4 border-l-4 border-l-status-critical flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-status-critical/15 text-status-critical shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-text-primary font-display">
                  Jamnagar Refinery Severe FRP Spike (Z-Score: +3.8)
                </h4>
                <Badge variant="critical" size="sm">High Severity</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Thermal source 142.6 MW detected 4.2x above historical 90-day baseline average.
              </p>
              <span className="text-[11px] font-mono text-text-muted mt-2 block">
                Triggered at 2026-08-28 18:30 IST • VIIRS NOAA-20
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary">False Positive</Button>
            <Button size="sm" variant="primary">Acknowledge</Button>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-status-warning flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-status-warning/15 text-status-warning shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-text-primary font-display">
                  Bokaro Steel Metallurgy Thermal Exceedance
                </h4>
                <Badge variant="warning" size="sm">Medium Severity</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Persistent heat source detected in secondary storage perimeter.
              </p>
              <span className="text-[11px] font-mono text-text-muted mt-2 block">
                Triggered at 2026-08-28 07:50 IST • MODIS Terra
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary">False Positive</Button>
            <Button size="sm" variant="primary">Acknowledge</Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

