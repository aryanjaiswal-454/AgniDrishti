import React, { useState } from "react";
import { motion } from "framer-motion";
import { Satellite, Database, MapPin, History, Cpu, BellRing, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, Badge, Button } from "../../components/ui";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export const PipelineArchitectureSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const pipelineSteps = [
    {
      id: "firms",
      title: "1. NASA FIRMS Ingestion",
      subtitle: "Near Real-Time Satellite Telemetry",
      icon: <Satellite className="w-5 h-5 text-brand-orange" />,
      badge: "30-Min Cron",
      tech: "VIIRS NOAA-20 / SNPP & MODIS Terra/Aqua",
      description: "Automated ingestion worker polls NASA FIRMS REST API for the Indian subcontinent bounding box (6.5°N–38.5°N, 68.0°E–97.5°E), filtering scan angle, FRP, and confidence values.",
      metrics: [
        { label: "Polling Cadence", val: "Every 30 mins" },
        { label: "Resolution", val: "375m NRT" },
        { label: "Deduplication", val: "Deterministic Hash" },
      ],
    },
    {
      id: "spatial",
      title: "2. Geospatial PostGIS Indexing",
      subtitle: "Spatial GiST & BBox Processing",
      icon: <Database className="w-5 h-5 text-intelligence-cyan" />,
      badge: "PostGIS 3.4",
      tech: "EPSG:4326 WGS84 Spatial Indexing",
      description: "Raw coordinates are converted into PostGIS geometry points (`ST_SetSRID(ST_MakePoint(lon, lat), 4326)`). High-speed spatial indexing enables sub-millisecond bounding box lookups.",
      metrics: [
        { label: "Index Type", val: "GiST 2D R-Tree" },
        { label: "Lookup Speed", val: "< 5ms" },
        { label: "Projection", val: "WGS84 EPSG:4326" },
      ],
    },
    {
      id: "facility",
      title: "3. Facility Spatial Association",
      subtitle: "OpenStreetMap Infrastructure Match",
      icon: <MapPin className="w-5 h-5 text-status-success" />,
      badge: "ST_DWithin",
      tech: "2,481+ Indian Refineries, Steel Plants & Depots",
      description: "Spatial proximity queries cross-reference the hotspot with known industrial facility polygons within a 1,000m radial buffer to associate the event with specific national infrastructure.",
      metrics: [
        { label: "Buffer Radius", val: "1,000 meters" },
        { label: "Mapped Assets", val: "2,481 Facilities" },
        { label: "Join Speed", val: "< 8ms Spatial Join" },
      ],
    },
    {
      id: "baseline",
      title: "4. Historical Baseline Engine",
      subtitle: "90-Day Rolling Thermal Statistics",
      icon: <History className="w-5 h-5 text-brand-amber" />,
      badge: "Rolling Stats",
      tech: "FRP Mean, Max, and Standard Deviation (σ)",
      description: "Queries historical detection frequency and average FRP over the preceding 90 days. Distinguishes constant routine thermal output from anomalous spike deviations.",
      metrics: [
        { label: "Temporal Window", val: "90-Day Rolling" },
        { label: "Anomaly Metric", val: "Z-Score / σ" },
        { label: "Flare Baseline", val: "Facility Specific" },
      ],
    },
    {
      id: "ai",
      title: "5. Multi-Track AI Ensembling",
      subtitle: "Machine Learning Classifier",
      icon: <Cpu className="w-5 h-5 text-brand-orange" />,
      badge: "Ensemble v2.0",
      tech: "Track A (Land-Cover) + Track B (Facility Recurrence)",
      description: "Synthesizes multi-spectral brightness ratios, land-cover logits, facility distance, and recurrence patterns to classify the detection into standard operational taxonomy with calibrated confidence.",
      metrics: [
        { label: "Inference Engine", val: "FastAPI Microservice" },
        { label: "Contract", val: "Standard JSON Schema" },
        { label: "Confidence", val: "Calibrated 0-100%" },
      ],
    },
    {
      id: "alert",
      title: "6. Operational Alert Triage",
      subtitle: "Real-Time Authority Dispatch",
      icon: <BellRing className="w-5 h-5 text-status-critical" />,
      badge: "WebSocket / SMS",
      tech: "Severity Scoring & Incident Escalation",
      description: "Events exceeding severity and anomaly thresholds trigger priority alert cards in the Command Center, streaming notifications to duty thermal analysts for verification and dispatch.",
      metrics: [
        { label: "Delivery Speed", val: "Instant WebSocket" },
        { label: "RBAC Guard", val: "Analyst & Admin" },
        { label: "Feedback Loop", val: "Human-in-the-Loop" },
      ],
    },
  ];

  return (
    <section id="pipeline" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-void border-t border-border-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-brand-orange uppercase">
            <span>03 • ARCHITECTURE & PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            From detection to <span className="text-brand-orange italic font-serif">understanding</span>.
          </h2>
          <p className="text-sm sm:text-base font-mono text-text-muted">
            The end-to-end operational ingestion, spatial indexing, and AI inference pipeline.
          </p>
        </div>

        {/* Step-by-Step Interactive Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Step Buttons */}
          <div className="lg:col-span-5 space-y-2">
            {pipelineSteps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-150 flex items-center justify-between border ${
                    isSelected
                      ? "bg-surface-2 border-brand-orange/50 shadow-brand-glow text-text-primary"
                      : "bg-surface/50 border-border-subtle hover:bg-surface-2/60 hover:border-border-normal text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? "bg-brand-orange/15 border-brand-orange/40 text-brand-orange"
                          : "bg-surface-3 border-border-subtle text-text-muted"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <div className="font-display font-semibold text-sm">{step.title}</div>
                      <div className="text-[11px] font-mono text-text-muted">{step.subtitle}</div>
                    </div>
                  </div>

                  <Badge variant={isSelected ? "brand" : "default"} size="sm">
                    {step.badge}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Step Inspection Card */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 bg-surface-2/90 border-brand-orange/30 backdrop-blur-md shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-brand-orange/15 border border-brand-orange/40 text-brand-orange">
                    {pipelineSteps[activeStep].icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-brand-amber uppercase tracking-wider block">
                      STAGE {activeStep + 1} OF 6
                    </span>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-text-primary">
                      {pipelineSteps[activeStep].title}
                    </h3>
                  </div>
                </div>
                <Badge variant="brand" size="md">
                  {pipelineSteps[activeStep].tech}
                </Badge>
              </div>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
                {pipelineSteps[activeStep].description}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {pipelineSteps[activeStep].metrics.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-3 rounded-lg bg-surface-3/60 border border-border-subtle font-mono text-center"
                  >
                    <div className="text-[10px] text-text-muted uppercase truncate">{m.label}</div>
                    <div className="text-xs sm:text-sm font-bold text-text-primary mt-0.5 truncate">
                      {m.val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                <button
                  onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : pipelineSteps.length - 1))}
                  className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
                >
                  &larr; Previous Stage
                </button>
                <div className="flex items-center gap-1.5">
                  {pipelineSteps.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        activeStep === i ? "w-6 bg-brand-orange" : "bg-border-normal"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveStep((prev) => (prev < pipelineSteps.length - 1 ? prev + 1 : 0))}
                  className="text-xs font-mono text-brand-amber hover:text-brand-orange transition-colors flex items-center gap-1"
                >
                  <span>Next Stage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

