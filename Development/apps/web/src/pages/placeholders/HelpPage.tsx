import React from "react";
import { PageContainer, PageHeader } from "../../components/shell";
import { Card, Badge, Button } from "../../components/ui";
import { HelpCircle, BookOpen, ExternalLink, Shield } from "lucide-react";

export const HelpPage: React.FC<{ onNavigate: (route: string) => void }> = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Operations Manual & Documentation"
        subtitle="Standard operating procedures for thermal anomaly verification and hazard response."
        badge={<Badge variant="cyan">SIH26162 Documentation</Badge>}
        breadcrumbs={[{ label: "AgniDrishti" }, { label: "Help & Docs" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-brand-orange/15 text-brand-orange">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="text-base font-display font-semibold text-text-primary">
            Thermal Triage Protocol
          </h4>
          <p className="text-xs text-text-secondary">
            Guidelines for verifying industrial flare exceedances vs. uncontrolled refinery fires using optical validation.
          </p>
          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
            Read SOP Guide
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-intelligence-cyan/15 text-intelligence-cyan">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="text-base font-display font-semibold text-text-primary">
            PS Context: SIH26162
          </h4>
          <p className="text-xs text-text-secondary">
            AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources (NTRO / Disaster Management).
          </p>
          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
            Problem Spec
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-surface-3 text-text-primary">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h4 className="text-base font-display font-semibold text-text-primary">
            Keyboard Shortcuts
          </h4>
          <div className="space-y-1.5 text-xs font-mono text-text-secondary">
            <div className="flex justify-between">
              <span>Command Palette</span>
              <span className="text-brand-orange font-bold">Ctrl + K</span>
            </div>
            <div className="flex justify-between">
              <span>Close Dialogs</span>
              <span className="text-text-muted">ESC</span>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

