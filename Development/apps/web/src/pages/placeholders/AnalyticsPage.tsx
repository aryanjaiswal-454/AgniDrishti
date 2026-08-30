import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Progress } from "../../components/ui";
import { BarChart3 } from "lucide-react";

export const AnalyticsPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Thermal Intelligence Analytics"
        subtitle="Time-series FRP distributions, baseline standard deviation trends, and spatial clustering."
        badge={<Badge variant="brand">Rolling 90-Day</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Analytics" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-orange" />
            <h4 className="text-sm font-semibold font-display text-text-primary">
              Facility FRP Distribution (Industrial vs. Forest)
            </h4>
          </div>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Refineries & Chemical Flares</span>
                <span className="text-brand-orange">62%</span>
              </div>
              <Progress value={62} variant="brand" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Thermal Power Stations</span>
                <span className="text-intelligence-cyan">24%</span>
              </div>
              <Progress value={24} variant="cyan" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Mining Thermal Areas</span>
                <span className="text-status-info">14%</span>
              </div>
              <Progress value={14} variant="warning" />
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-center items-center text-center">
          <Badge variant="cyan" className="mb-2">Recharts Visualization Layer</Badge>
          <h4 className="text-base font-display font-semibold text-text-primary">
            Interactive FRP Time-Series Charts
          </h4>
          <p className="text-xs text-text-secondary max-w-sm mt-1">
            Recharts integration with rolling baseline confidence bounds will be mounted in Phase D5.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
};

