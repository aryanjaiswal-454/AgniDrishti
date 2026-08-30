import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Input, Select, Button } from "../../components/ui";
import { Settings, Save } from "lucide-react";

export const SettingsPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="System Settings & Preferences"
        subtitle="Analyst threshold configuration, notification alerts, and API coordinates."
        badge={<Badge variant="default">Preferences</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Settings" }]}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
            Save Changes
          </Button>
        }
      />

      <Card className="p-6 max-w-2xl space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <Settings className="w-4 h-4 text-brand-orange" />
          <h4 className="text-sm font-semibold font-display text-text-primary">
            Thermal Anomaly Trigger Thresholds
          </h4>
        </div>

        <Input
          label="CRITICAL FRP THRESHOLD (MW)"
          type="number"
          defaultValue={150}
          placeholder="FRP in MW"
        />

        <Input
          label="ANOMALY Z-SCORE THRESHOLD"
          type="number"
          step="0.1"
          defaultValue={3.0}
          placeholder="Standard deviations above 90d baseline"
        />

        <Select
          label="DEFAULT MAP BASELAYER"
          options={[
            { value: "dark", label: "CartoDB Dark Matter (Tactical Dark)" },
            { value: "satellite", label: "ESRI World Imagery (Satellite Optical)" },
            { value: "osm", label: "OpenStreetMap Standard" },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

