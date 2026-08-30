import React from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Flame, Layers, Building2, History, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Card, Badge } from "../../components/ui";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export const ContextEnrichmentSection: React.FC = () => {
  const contextVectors = [
    {
      id: "thermal",
      step: "01",
      title: "THERMAL SIGNAL",
      source: "NASA FIRMS NRT",
      icon: <Flame className="w-5 h-5 text-brand-orange" />,
      color: "border-brand-orange/40 bg-brand-orange/5",
      badgeVariant: "brand" as const,
      dataValues: [
        { label: "Radiative Power", val: "184.2 MW" },
        { label: "Brightness Temp", val: "367.4 K" },
        { label: "Day / Night", val: "Night Pass" },
      ],
    },
    {
      id: "landcover",
      step: "02",
      title: "LAND COVER",
      source: "Dynamic World / Copernicus",
      icon: <Layers className="w-5 h-5 text-status-success" />,
      color: "border-status-success/40 bg-status-success/5",
      badgeVariant: "success" as const,
      dataValues: [
        { label: "Surface Class", val: "Built Infrastructure" },
        { label: "Vegetation Index", val: "0.04 (Barren/Paved)" },
        { label: "Water Proximity", val: "1.2 km (Arabian Sea)" },
      ],
    },
    {
      id: "facility",
      step: "03",
      title: "FACILITY BOUNDARY",
      source: "OpenStreetMap PostGIS",
      icon: <Building2 className="w-5 h-5 text-intelligence-cyan" />,
      color: "border-intelligence-cyan/40 bg-intelligence-cyan/5",
      badgeVariant: "cyan" as const,
      dataValues: [
        { label: "Matched Facility", val: "Jamnagar Complex" },
        { label: "Asset Category", val: "Refinery & Petrochem" },
        { label: "Distance to Unit", val: "320 m (Inside Poly)" },
      ],
    },
    {
      id: "history",
      step: "04",
      title: "HISTORICAL BASELINE",
      source: "90-Day Rolling Timeseries",
      icon: <History className="w-5 h-5 text-brand-amber" />,
      color: "border-brand-amber/40 bg-brand-amber/5",
      badgeVariant: "warning" as const,
      dataValues: [
        { label: "90-Day Recurrence", val: "2 / 90 Days (Rare)" },
        { label: "Baseline Mean", val: "28.5 MW" },
        { label: "Anomaly Spike", val: "+4.1σ Deviation" },
      ],
    },
  ];

  return (
    <section id="context" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-surface-2/30 border-t border-border-subtle overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-intelligence-cyan/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-intelligence-cyan uppercase">
            <span>02 • MULTI-MODAL DATA FUSION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            Context <span className="text-intelligence-cyan italic font-serif">changes everything</span>.
          </h2>
          <p className="text-sm sm:text-base font-mono text-text-muted">
            By fusing four disparate data streams in milliseconds, AgniDrishti reconstructs the ground reality.
          </p>
        </div>

        {/* The 4 Converging Data Vectors */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative"
        >
          {contextVectors.map((v, idx) => (
            <motion.div key={v.id} variants={fadeInVariants} className="relative group">
              <Card className={`h-full p-5 bg-surface/90 backdrop-blur-sm border ${v.color} flex flex-col justify-between transition-all duration-200 hover:-translate-y-1`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted">VECTOR {v.step}</span>
                    <Badge variant={v.badgeVariant} size="sm">
                      {v.source}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="p-2 rounded-lg bg-surface-2 border border-border-subtle shrink-0">
                      {v.icon}
                    </div>
                    <span className="font-display font-bold text-sm tracking-tight text-text-primary">
                      {v.title}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border-subtle/60 text-xs font-mono">
                    {v.dataValues.map((d, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between">
                        <span className="text-text-muted">{d.label}:</span>
                        <span className="font-semibold text-text-primary">{d.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {idx < 3 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-surface-3 border border-border-normal items-center justify-center text-text-muted">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Synthesized Output Banner */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
        >
          <Card className="p-6 sm:p-8 bg-gradient-to-r from-brand-orange/15 via-surface-2 to-intelligence-cyan/15 border-brand-orange/40 backdrop-blur-md shadow-glass">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-brand-orange/20 border border-brand-orange/50 text-brand-orange shadow-brand-glow shrink-0">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-brand-amber">
                      SYNTHESIZED AI CLASSIFICATION
                    </span>
                    <Badge variant="critical" size="sm" dot>
                      THREAT VERIFIED
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-text-primary mt-1">
                    Industrial Fire • 92% Confidence (Non-Routine Hazard)
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-text-secondary mt-1">
                    Confirmed abnormal thermal bloom within secondary converter zone • Exceeds rolling FRP baseline by +4.1σ
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="text-right font-mono">
                  <div className="text-[10px] text-text-muted uppercase">ESCALATION PROTOCOL</div>
                  <div className="text-xs font-bold text-status-critical">DISASTER MGMT & POLICE</div>
                </div>
                <div className="p-2 rounded-lg bg-status-critical/15 border border-status-critical/30 text-status-critical">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

