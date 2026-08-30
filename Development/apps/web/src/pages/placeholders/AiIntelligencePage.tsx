import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, ConfidenceIndicator } from "../../components/ui";
import { Cpu, ShieldCheck } from "lucide-react";

export const AiIntelligencePage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="AI Classifier Intelligence"
        subtitle="Ensemble inference engine combining Track A Land-Cover Classifier and Track B Facility Recurrence Model."
        badge={<Badge variant="brand" dot>Model v2.0 Ensembled</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "AI Intelligence" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-orange" />
              <h4 className="text-sm font-semibold font-display text-text-primary">
                Track A: Natural vs. Industrial Classifier
              </h4>
            </div>
            <Badge variant="cyan" size="sm">Random Forest</Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Performs point-in-raster lookups on Copernicus 100m Land Cover and normalizes brightness/daynight temporal signatures.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
            <span className="text-xs font-mono text-text-muted">Target Precision:</span>
            <ConfidenceIndicator score={0.88} />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-intelligence-cyan" />
              <h4 className="text-sm font-semibold font-display text-text-primary">
                Track B: Facility Recurrence & Anomaly Model
              </h4>
            </div>
            <Badge variant="brand" size="sm">Z-Score Engine</Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Computes distance to nearest OSM industrial facility and checks rolling 90-day persistence metrics for anomaly classification.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
            <span className="text-xs font-mono text-text-muted">Target Precision:</span>
            <ConfidenceIndicator score={0.94} />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

