import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button } from "../../components/ui";
import { Building2, Search, Plus } from "lucide-react";

export const FacilitiesPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Industrial Facilities Registry"
        subtitle="Critical national infrastructure, refineries, power plants, steel mills, and mining zones."
        badge={<Badge variant="cyan" dot>2,481 Mapped</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Facilities" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
              Search Registry
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Facility
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-brand-orange font-semibold">Refinery</span>
            <Badge variant="success" size="sm">Active Baseline</Badge>
          </div>
          <h4 className="text-base font-display font-semibold text-text-primary">Jamnagar Refinery Complex</h4>
          <p className="text-xs text-text-secondary">Reliance Industries • Gujarat (West Coast)</p>
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-text-muted border-t border-border-subtle">
            <span>Avg FRP: 45.2 MW</span>
            <span>Threshold: 120 MW</span>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-intelligence-cyan font-semibold">Power Plant</span>
            <Badge variant="success" size="sm">Active Baseline</Badge>
          </div>
          <h4 className="text-base font-display font-semibold text-text-primary">Vindhyachal Super Thermal</h4>
          <p className="text-xs text-text-secondary">NTPC • Singrauli, Madhya Pradesh</p>
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-text-muted border-t border-border-subtle">
            <span>Avg FRP: 85.0 MW</span>
            <span>Threshold: 250 MW</span>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-status-info font-semibold">Steel Plant</span>
            <Badge variant="success" size="sm">Active Baseline</Badge>
          </div>
          <h4 className="text-base font-display font-semibold text-text-primary">Bokaro Steel Plant</h4>
          <p className="text-xs text-text-secondary">SAIL • Bokaro, Jharkhand</p>
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-text-muted border-t border-border-subtle">
            <span>Avg FRP: 110.5 MW</span>
            <span>Threshold: 300 MW</span>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

