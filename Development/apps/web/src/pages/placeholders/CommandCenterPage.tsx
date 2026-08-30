import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button, KpiCard } from "../../components/ui";
import { Flame, Layers, Shield, Activity, ArrowUpRight } from "lucide-react";

export const CommandCenterPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  return (
    <PageContainer>
      <PageHeader
        title="Intelligence Command Center"
        subtitle="National thermal anomaly detection, industrial flare monitoring, and threat triage."
        badge={<Badge variant="brand" dot>Live Telemetry</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Command Center" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="cyan" size="sm" leftIcon={<Layers className="w-4 h-4" />} onClick={() => onNavigate("/live-map")}>
              Open GIS Map View
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Thermal Hotspots (24h)" value="142" trend={{ value: "+12%", isPositive: false }} icon={<Flame className="w-4 h-4 text-brand-orange" />} accent="orange" sublabel="NASA VIIRS & MODIS" />
        <KpiCard label="Monitored Facilities" value="2,481" trend={{ value: "8 updated", isPositive: true }} icon={<Layers className="w-4 h-4 text-intelligence-cyan" />} accent="cyan" sublabel="OpenStreetMap Layer" />
        <KpiCard label="Threat Alerts" value="3" trend={{ value: "2 unacknowledged", isPositive: false }} icon={<Shield className="w-4 h-4 text-status-critical" />} accent="critical" sublabel="Refineries & Flare Spikes" />
        <KpiCard label="AI Model Ensembling" value="94.8%" trend={{ value: "v2.0 Active", isPositive: true }} icon={<Activity className="w-4 h-4 text-status-success" />} accent="none" sublabel="Track A & B Fused" />
      </div>

      <Card className="p-6 text-center border-dashed border-border-normal bg-surface/40">
        <div className="max-w-md mx-auto space-y-3">
          <Badge variant="cyan">Command Center Placeholder</Badge>
          <h3 className="text-lg font-display font-semibold text-text-primary">
            Full Command Center Dashboard Wiring
          </h3>
          <p className="text-xs text-text-secondary">
            Interactive command center widgets, live anomaly feed table, and spatial overview will be connected in Phase D5 (Map & Dashboard) and Phase D6 (Real-Time Alerts).
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("/events")}>
              View Thermal Events
            </Button>
            <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />} onClick={() => onNavigate("/design-system")}>
              Inspect Design System
            </Button>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

