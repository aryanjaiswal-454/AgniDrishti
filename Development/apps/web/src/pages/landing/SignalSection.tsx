import React from "react";
import { motion } from "framer-motion";
import { Flame, HelpCircle, AlertTriangle, Radio, Navigation, Thermometer, Compass, Clock } from "lucide-react";
import { Card, Badge } from "../../components/ui";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export const SignalSection: React.FC = () => {
  return (
    <section id="signal" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-void border-t border-border-subtle overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-brand-orange uppercase">
            <span>01 • THE AMBIGUITY PROBLEM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            A thermal signal is <span className="text-brand-orange italic font-serif">only a signal</span>.
          </h2>
          <p className="text-sm sm:text-base font-mono text-text-muted">
            NASA satellites capture thousands of radiometric hotspots across India daily.
          </p>
        </div>

        {/* Interactive Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Raw Satellite Telemetry Packet */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInVariants}
            className="lg:col-span-6"
          >
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-orange/20 to-brand-amber/10 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
              
              <Card className="relative p-6 sm:p-8 bg-surface-2/95 border-brand-orange/40 backdrop-blur-md shadow-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-text-muted uppercase block">
                        RAW SATELLITE TELEMETRY (NASA FIRMS)
                      </span>
                      <span className="text-base font-display font-bold text-text-primary">
                        NRT HOTSPOT DETECTION #IN-26162
                      </span>
                    </div>
                  </div>
                  <Badge variant="brand" dot>
                    RAW SIGNAL
                  </Badge>
                </div>

                {/* Coordinate & Metric Grid */}
                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div className="p-3.5 rounded-lg bg-surface-3/70 border border-border-subtle space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-text-muted uppercase">
                      <Compass className="w-3 h-3 text-intelligence-cyan" />
                      <span>Latitude / Longitude</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-text-primary">
                      22.4707° N
                    </div>
                    <div className="text-sm font-semibold text-text-secondary">
                      70.0577° E
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-3/70 border border-border-subtle space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-text-muted uppercase">
                      <Thermometer className="w-3 h-3 text-brand-orange" />
                      <span>Fire Radiative Power</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-brand-orange">
                      184.2 <span className="text-xs text-text-muted font-normal">MW</span>
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Brightness TI4: 367.4 K
                    </div>
                  </div>
                </div>

                {/* Satellite Acquisition Metadata */}
                <div className="p-3 rounded-lg bg-surface-3/40 border border-border-subtle/60 text-xs font-mono text-text-muted flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-intelligence-cyan" />
                    <span>Sensor: VIIRS NOAA-20 (375m)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-amber" />
                    <span>Scan: Night Pass (18:42 UTC)</span>
                  </div>
                </div>

                {/* Raw Limitations Warning */}
                <div className="p-3.5 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-xs font-mono text-brand-amber flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Telemetry Limit:</strong> Raw FIRMS indicates elevated radiative energy only. It possesses zero semantic knowledge of land use, infrastructure boundaries, or historical facility variance.
                  </span>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Right: The Critical Question */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInVariants}
            className="lg:col-span-6 space-y-6"
          >
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-intelligence-cyan">
                The Fundamental Operational Dilemma
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-text-primary tracking-tight">
                "But what caused it?"
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
                Without intelligence layer synthesis, responders face four entirely conflicting hypotheses for the exact same coordinate and FRP signature:
              </p>
            </div>

            {/* Dilemma Hypotheses Cards */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-between hover:border-status-critical/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-status-critical" />
                  <span className="font-semibold text-text-primary">Catastrophic Industrial Refinery Fire</span>
                </div>
                <span className="text-status-critical font-medium text-[10px]">CRITICAL HAZARD</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-between hover:border-brand-amber/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-amber" />
                  <span className="font-semibold text-text-primary">Standard Petrochemical Elevated Gas Flare</span>
                </div>
                <span className="text-brand-amber font-medium text-[10px]">ROUTINE OPERATION</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-between hover:border-intelligence-cyan/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-intelligence-cyan" />
                  <span className="font-semibold text-text-primary">Post-Harvest Agricultural Stubble Burn</span>
                </div>
                <span className="text-intelligence-cyan font-medium text-[10px]">SEASONAL BIOMASS</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-between hover:border-text-muted transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-text-muted" />
                  <span className="font-semibold text-text-primary">Unchecked Wildland/Forest Fire</span>
                </div>
                <span className="text-text-muted font-medium text-[10px]">ECOLOGICAL EVENT</span>
              </div>
            </div>

            <p className="text-xs font-mono text-text-muted italic">
              Dispatching emergency crews to normal gas flares wastes critical resources. Missing a genuine refinery explosion costs lives.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

