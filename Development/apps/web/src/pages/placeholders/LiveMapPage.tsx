import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button } from "../../components/ui";
import { Map, Layers, Radio } from "lucide-react";

export const LiveMapPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title="Geospatial Live Threat Map"
        subtitle="Multi-layered GIS mapping of NASA FIRMS thermal hotspots overlaid on OpenStreetMap industrial facilities."
        badge={<Badge variant="cyan" dot>GIS Overlay Ready</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Live Map" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Radio className="w-3.5 h-3.5" />}>
              Filter Satellite Pass
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />} onClick={() => onNavigate("/facilities")}>
              Facilities Layer
            </Button>
          </div>
        }
      />

      <Card className="h-[650px] flex flex-col items-center justify-center p-8 text-center border-dashed border-border-normal bg-surface/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-vignette opacity-20 pointer-events-none" />
        <div className="p-4 rounded-full bg-surface-2 border border-intelligence-cyan/40 text-intelligence-cyan mb-4 shadow-cyan-glow">
          <Map className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-xl font-display font-bold text-text-primary">
          Interactive React-Leaflet GIS Map
        </h3>
        <p className="text-xs text-text-secondary max-w-lg mt-2 mb-6">
          High-performance geospatial visualization with color-coded classification markers (Refineries, Gas Flares, Agricultural Burning, Forest Fires) and facility polygons is scheduled for **Phase D5**.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onNavigate("/command-center")}>
            ← Back to Command Center
          </Button>
          <Button variant="cyan" size="sm" onClick={() => onNavigate("/events")}>
            View Event Table →
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

