import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button, StatusBadge } from "../../components/ui";
import { Flame, Filter, Download } from "lucide-react";

export const ThermalEventsPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Thermal Events & Classified Hotspots"
        subtitle="Historical and near real-time thermal detections classified by AI inference models."
        badge={<Badge variant="brand" dot>Live Stream</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Thermal Events" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
              Filter Class
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export Data
            </Button>
          </div>
        }
      />

      {/* Preview Sample Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-mono font-semibold uppercase text-text-primary">
              Recent AI-Classified Thermal Detections
            </span>
          </div>
          <Badge variant="cyan" size="sm">
            Phase D4.4 Target
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-3/50 text-text-muted border-b border-border-subtle uppercase">
              <tr>
                <th className="px-4 py-2.5">Acquisition</th>
                <th className="px-4 py-2.5">Coordinates</th>
                <th className="px-4 py-2.5">FRP (MW)</th>
                <th className="px-4 py-2.5">Brightness</th>
                <th className="px-4 py-2.5">Sub Class</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40 text-text-secondary">
              <tr className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3 text-text-primary">2026-08-28 18:30 (VIIRS)</td>
                <td className="px-4 py-3 text-intelligence-cyan">22.35561° N, 69.85192° E</td>
                <td className="px-4 py-3 font-semibold text-brand-orange">142.6 MW</td>
                <td className="px-4 py-3">345.8 K</td>
                <td className="px-4 py-3"><StatusBadge status="gas_flare" /></td>
                <td className="px-4 py-3"><Badge variant="success" size="sm">Nominal</Badge></td>
              </tr>
              <tr className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3 text-text-primary">2026-08-28 07:50 (MODIS)</td>
                <td className="px-4 py-3 text-intelligence-cyan">23.66930° N, 86.15110° E</td>
                <td className="px-4 py-3 font-semibold text-status-critical">420.0 MW</td>
                <td className="px-4 py-3">368.2 K</td>
                <td className="px-4 py-3"><StatusBadge status="industrial_fire" /></td>
                <td className="px-4 py-3"><Badge variant="critical" size="sm" dot>Anomalous</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
};

