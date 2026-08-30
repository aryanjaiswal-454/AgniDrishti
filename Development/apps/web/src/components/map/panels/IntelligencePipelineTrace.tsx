import React, { useState } from "react";
import { ThermalMarkerData } from "../types";
import { AlertWithDetails } from "../../../api/alerts";
import {
  Satellite,
  Building2,
  Activity,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
} from "lucide-react";

export interface IntelligencePipelineTraceProps {
  marker: ThermalMarkerData;
  linkedAlert?: AlertWithDetails | null;
}

interface TraceStep {
  id: string;
  number: string;
  label: string;
  status: "done" | "awaiting";
  icon: React.ReactNode;
  detail?: React.ReactNode;
}

/**
 * Compact 5-step intelligence pipeline trace.
 * Shows the actual processing status of a selected thermal event
 * through the AgniDrishti pipeline.
 *
 * Only shows steps supported by actual available data.
 */
export const IntelligencePipelineTrace: React.FC<IntelligencePipelineTraceProps> = ({
  marker,
  linkedAlert,
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    setExpandedStep((prev) => (prev === id ? null : id));
  };

  const steps: TraceStep[] = [
    {
      id: "detected",
      number: "01",
      label: "DETECTED",
      status: "done",
      icon: <Satellite className="w-3.5 h-3.5" />,
      detail: (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Source:</span>
            <span className="text-text-primary">NASA FIRMS NRT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Acquisition:</span>
            <span className="text-text-primary">{marker.acquisition_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Coordinates:</span>
            <span className="text-text-primary font-mono">
              {marker.lat.toFixed(4)}°, {marker.lon.toFixed(4)}°
            </span>
          </div>
          {marker.frp !== null && (
            <div className="flex justify-between">
              <span className="text-text-muted">FRP:</span>
              <span className="text-brand-orange font-bold">{marker.frp} MW</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "contextualized",
      number: "02",
      label: "CONTEXTUALIZED",
      status: marker.facility_name ? "done" : "awaiting",
      icon: <Building2 className="w-3.5 h-3.5" />,
      detail: marker.facility_name ? (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Nearest facility:</span>
            <span className="text-text-primary font-semibold truncate ml-2 max-w-[160px]">
              {marker.facility_name}
            </span>
          </div>
          {marker.distance_to_facility_m !== null && (
            <div className="flex justify-between">
              <span className="text-text-muted">Distance:</span>
              <span className="text-intelligence-cyan font-bold">
                ~{Math.round(marker.distance_to_facility_m)} m
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-[10px] text-text-muted">
          No industrial facility matched within 1,000m buffer zone.
        </div>
      ),
    },
    {
      id: "analyzed",
      number: "03",
      label: "ANALYZED",
      status: "done",
      icon: <Activity className="w-3.5 h-3.5" />,
      detail: (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Anomaly status:</span>
            <span
              className={
                marker.is_anomalous
                  ? "text-status-critical font-bold"
                  : "text-status-success"
              }
            >
              {marker.is_anomalous ? "ANOMALOUS (+3σ)" : "NOMINAL"}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "classified",
      number: "04",
      label: "CLASSIFIED",
      status: marker.sub_class && marker.sub_class !== "unclassified" ? "done" : "awaiting",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      detail: (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Primary:</span>
            <span className="text-text-primary uppercase">{marker.primary_class}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Sub-class:</span>
            <span className="text-text-primary uppercase">
              {marker.sub_class.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Confidence:</span>
            <span className="text-brand-amber font-bold">
              {Math.round(marker.confidence_score * 100)}%
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "prioritized",
      number: "05",
      label: "PRIORITIZED",
      status: linkedAlert ? "done" : "awaiting",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      detail: linkedAlert ? (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Alert severity:</span>
            <span
              className={`font-bold uppercase ${
                linkedAlert.severity === "high"
                  ? "text-status-critical"
                  : linkedAlert.severity === "medium"
                  ? "text-status-warning"
                  : "text-text-muted"
              }`}
            >
              {linkedAlert.severity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Status:</span>
            <span className="text-text-primary uppercase">{linkedAlert.status}</span>
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-text-muted">
          No alert generated for this event.
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-0.5" data-testid="intelligence-pipeline-trace">
      <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-2">
        Intelligence Trace
      </div>
      {steps.map((step) => {
        const isExpanded = expandedStep === step.id;
        const StatusIcon =
          step.status === "done" ? (
            <Check className="w-3 h-3 text-status-success" />
          ) : (
            <Clock className="w-3 h-3 text-text-muted" />
          );

        return (
          <div key={step.id}>
            <button
              type="button"
              onClick={() => toggleStep(step.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all text-left ${
                isExpanded
                  ? "bg-surface-2 border border-border-normal"
                  : "hover:bg-surface-2/60 border border-transparent"
              }`}
              aria-expanded={isExpanded}
              aria-label={`${step.label} - ${step.status}`}
            >
              {/* Step Number */}
              <span className="text-text-muted text-[9px] font-mono w-4 shrink-0">
                {step.number}
              </span>

              {/* Status Icon */}
              <span className="shrink-0">{StatusIcon}</span>

              {/* Step Icon + Label */}
              <span
                className={`shrink-0 ${
                  step.status === "done" ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {step.icon}
              </span>
              <span
                className={`flex-1 font-mono font-semibold tracking-wider ${
                  step.status === "done" ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {step.label}
              </span>

              {/* Expand/Collapse */}
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
              )}
            </button>

            {/* Expanded Detail */}
            {isExpanded && step.detail && (
              <div className="ml-[52px] mr-2 mt-1 mb-1.5 p-2 rounded bg-surface-2/60 border border-border-subtle">
                {step.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

