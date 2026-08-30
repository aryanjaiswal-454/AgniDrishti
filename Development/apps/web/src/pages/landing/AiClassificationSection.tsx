import React from "react";
import { motion } from "framer-motion";
import { Cpu, CheckCircle2, Sliders, ShieldAlert, Sparkles, BarChart2, Zap } from "lucide-react";
import { Card, Badge, ConfidenceIndicator, Progress } from "../../components/ui";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export const AiClassificationSection: React.FC = () => {
  const signalWeights = [
    {
      feature: "Facility Proximity Match",
      value: "320m to Industrial Perimeter",
      weight: 95,
      impact: "+38% Confidence Weight",
      status: "PASS",
    },
    {
      feature: "FRP Standard Deviation",
      value: "+4.1σ Spike over Rolling Baseline",
      weight: 90,
      impact: "+32% Confidence Weight",
      status: "PASS",
    },
    {
      feature: "Historical Recurrence Rate",
      value: "2 detections / 90 days (Statistical Outlier)",
      weight: 85,
      impact: "+18% Confidence Weight",
      status: "PASS",
    },
    {
      feature: "Land-Cover Probability",
      value: "0.96 Built Structure & Industrial Polygon",
      weight: 92,
      impact: "+12% Confidence Weight",
      status: "PASS",
    },
  ];

  return (
    <section id="ai-model" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-surface-2/20 border-t border-border-subtle overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-brand-orange uppercase">
            <span>05 • MACHINE LEARNING INFERENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            AI Classification <span className="text-brand-orange italic font-serif">Deconstruction</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-text-muted">
            Multi-modal feature weights fused by Track A (Land Cover) and Track B (Facility Recurrence) ensemble models.
          </p>
        </div>

        {/* AI Deconstruction Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInVariants}
        >
          <Card className="p-6 sm:p-10 bg-surface-2/95 border-brand-orange/40 backdrop-blur-md shadow-2xl space-y-8">
            {/* Top Inference Output Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-brand-orange/15 border border-brand-orange/40 text-brand-orange shadow-brand-glow">
                  <Cpu className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-amber">
                      ENSEMBLE MODEL v2.0 INFERENCE
                    </span>
                    <Badge variant="brand" size="sm">
                      CALIBRATED
                    </Badge>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary mt-0.5">
                    Industrial Fire Detection
                  </h3>
                </div>
              </div>

              <div className="w-full md:w-auto p-4 rounded-xl bg-surface-3/80 border border-border-subtle flex items-center gap-6">
                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase">CALIBRATED CONFIDENCE</div>
                  <div className="text-2xl font-black font-mono text-brand-orange">92.4%</div>
                </div>
                <div className="w-32">
                  <ConfidenceIndicator score={0.924} size="md" />
                </div>
              </div>
            </div>

            {/* Feature Decomposition Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-intelligence-cyan" />
                  MULTIVARIATE FEATURE CONTRIBUTION BREAKDOWN
                </span>
                <span className="text-[10px] uppercase">DEMO WEIGHT VECTOR</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {signalWeights.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-3/60 border border-border-subtle space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                        <span className="font-display font-semibold text-sm text-text-primary">
                          {s.feature}
                        </span>
                      </div>
                      <Badge variant="success" size="sm">
                        {s.status}
                      </Badge>
                    </div>

                    <div className="text-xs font-mono text-text-secondary pl-6">
                      {s.value}
                    </div>

                    <div className="pt-1 pl-6 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-brand-amber">
                        <span>{s.impact}</span>
                        <span>{s.weight}%</span>
                      </div>
                      <Progress value={s.weight} max={100} variant="brand" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer & Explanation */}
            <div className="p-4 rounded-xl bg-surface-3/40 border border-border-subtle text-xs font-mono text-text-muted flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Deterministic PostGIS spatial validation eliminates 99.1% of false positive alarms.</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase text-text-muted">
                SIH26162 CONTRACT
              </span>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

