import React from "react";
import { Card, Badge } from "../../components/ui";
import { Sparkles, Cpu, CheckCircle2 } from "lucide-react";

export interface ClassBreakdown {
  sub_class: string;
  count: number;
}

export interface AiIntelligencePanelProps {
  breakdown: ClassBreakdown[];
  anomalousCount: number;
  totalCount: number;
  isLoading: boolean;
  metadata?: {
    version: string;
    strategy: string;
    anomaly_threshold: string;
  };
}

export const AiIntelligencePanel: React.FC<AiIntelligencePanelProps> = ({
  breakdown,
  anomalousCount,
  totalCount,
  isLoading,
  metadata,
}) => {
  return (
    <Card className="p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-intelligence-cyan" />
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
            AI Classification Engine
          </h4>
        </div>
        <Badge variant="cyan" size="sm">
          {metadata?.version || "v1.0.0-rules-ml-hybrid"}
        </Badge>
      </div>

      <div className="space-y-3 text-xs font-mono">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded bg-surface-2 border border-border-subtle">
            <span className="text-text-muted text-[10px] block uppercase">Classification Mode</span>
            <span className="text-text-primary font-semibold mt-0.5 block">{metadata?.strategy || "Rules + PostGIS Spatial"}</span>
          </div>
          <div className="p-2.5 rounded bg-surface-2 border border-border-subtle">
            <span className="text-text-muted text-[10px] block uppercase">Anomaly Threshold</span>
            <span className="text-status-critical font-semibold mt-0.5 block">{metadata?.anomaly_threshold || "+3.0σ FRP Exceedance"}</span>
          </div>
        </div>

        {/* Classification Breakdown Distribution */}
        {breakdown.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] uppercase text-text-muted">Classification Taxonomy Distribution</div>
            <div className="space-y-1">
              {breakdown.map((item) => {
                const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                return (
                  <div key={item.sub_class} className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">
                      {item.sub_class.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-text-primary font-semibold">
                      {item.count} <span className="text-text-muted font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-2.5 rounded bg-surface-2/60 border border-border-subtle text-[11px] text-text-muted">
          Multi-modal context fusion active across NASA FIRMS NRT stream & OpenStreetMap industrial geometries.
        </div>
      </div>
    </Card>
  );
};

