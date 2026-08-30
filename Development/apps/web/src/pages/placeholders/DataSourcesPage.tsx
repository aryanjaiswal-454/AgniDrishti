import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button } from "../../components/ui";
import { Database, Radio, RefreshCw } from "lucide-react";

export const DataSourcesPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Data Sources & Ingestion Pipelines"
        subtitle="Active sensor streams, NASA FIRMS polling cycles, OpenStreetMap synchronization, and BullMQ queues."
        badge={<Badge variant="success" dot>Pipelines Online</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Data Sources" }]}
        actions={
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Poll Feeds
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-orange" />
              <h4 className="text-sm font-semibold font-display text-text-primary">
                NASA FIRMS NRT Feed (Area API)
              </h4>
            </div>
            <Badge variant="success" size="sm">Healthy</Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Ingests VIIRS (SNPP, NOAA-20, NOAA-21) and MODIS active fire CSV streams at 30-minute intervals with coordinate deduplication.
          </p>
          <div className="pt-2 flex justify-between text-xs font-mono text-text-muted border-t border-border-subtle">
            <span>Last Sync: 18:30 IST</span>
            <span>Batch Size: 100</span>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-intelligence-cyan" />
              <h4 className="text-sm font-semibold font-display text-text-primary">
                OpenStreetMap Overpass API
              </h4>
            </div>
            <Badge variant="success" size="sm">Healthy</Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Maintains up-to-date industrial infrastructure geometries for all refineries, power stations, steel mills, and mines across India.
          </p>
          <div className="pt-2 flex justify-between text-xs font-mono text-text-muted border-t border-border-subtle">
            <span>Last Sync: Weekly Sun</span>
            <span>Facilities: 2,481</span>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

