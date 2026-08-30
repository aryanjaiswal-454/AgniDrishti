import React from "react";
import { motion } from "framer-motion";
import { Flame, ArrowDown, ArrowRight, Shield, Radio, Activity, Eye } from "lucide-react";
import { Button, Badge } from "../../components/ui";
import { GeospatialCanvas } from "./GeospatialCanvas";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export interface HeroSectionProps {
  onExplore: () => void;
  onEnterCommandCenter: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onEnterCommandCenter,
}) => {
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 overflow-hidden bg-void select-none">
      {/* Dynamic Geospatial Canvas Background */}
      <GeospatialCanvas />

      {/* Atmospheric lighting layers */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-[1]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/8 blur-[140px] rounded-full pointer-events-none z-[1]" />
      <div className="absolute bottom-12 right-1/4 w-[400px] h-[400px] bg-intelligence-cyan/5 blur-[120px] rounded-full pointer-events-none z-[1]" />

      {/* Content Container */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
      >
        {/* Top Hackathon & Threat Pill */}
        {/* <motion.div variants={fadeInVariants} className="inline-flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/90 border border-brand-orange/30 backdrop-blur-md text-[11px] font-mono text-text-secondary shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange" />
            </span>
            <span className="text-brand-orange font-bold">SIH26162</span>
            <span className="text-border-active">•</span>
            <span>National Thermal Anomaly Surveillance</span>
          </div>
        </motion.div> */}

        {/* Cinematic Headline & Product Wordmark */}
        <motion.div variants={fadeInVariants} className="space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-text-primary leading-[1.05]">
            {/* <span className="block text-text-muted text-xl sm:text-2xl md:text-3xl font-mono uppercase tracking-[0.25em] font-normal mb-2">
              National Defense & Disaster Intelligence
            </span> */}
            <span className=" text-brand-orange">AGNI</span>DRISHTI
          </h1>

          <div className="pt-1">
            <p className="text-lg sm:text-2xl font-mono font-semibold tracking-[0.15em] text-intelligence-cyan uppercase">
              AI-Powered Thermal Intelligence
            </p>
            <p className="text-sm sm:text-base font-mono text-text-muted tracking-[0.2em] uppercase mt-1">
              Detect &middot; Classify &middot; Monitor
            </p>
          </div>
        </motion.div>

        {/* Narrative Subtitle */}
        {/* <motion.p
          variants={fadeInVariants}
          className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto font-sans font-light leading-relaxed"
        >
          From high-latency raw satellite telemetry to real-time actionable threat classification. Discerning critical industrial infrastructure hazards from natural thermal events with multi-modal AI and GIS fusion.
        </motion.p> */}

        {/* Call to Actions */}
        <motion.div
          variants={fadeInVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onEnterCommandCenter}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto text-sm tracking-wider font-mono shadow-brand-glow"
          >
            ENTER COMMAND CENTER
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onExplore}
            leftIcon={<Eye className="w-4 h-4" />}
            rightIcon={<ArrowDown className="w-4 h-4" />}
            className="w-full sm:w-auto text-sm tracking-wider font-mono border-border-normal hover:border-brand-orange/40"
          >
            EXPLORE INTELLIGENCE
          </Button>
        </motion.div>

        {/* Live Operational Telemetry Ticker Strip */}
        <motion.div
          variants={fadeInVariants}
          className="pt-8 border-t border-border-subtle/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-left max-w-3xl mx-auto"
        >
          <div className="p-3 rounded-lg bg-surface-2/60 border border-border-subtle backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase">
              <Radio className="w-3 h-3 text-brand-orange" />
              <span>Sensors</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-text-primary mt-1">
              NASA VIIRS + MODIS
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2/60 border border-border-subtle backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase">
              <Activity className="w-3 h-3 text-intelligence-cyan" />
              <span>Pipeline Mode</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-text-primary mt-1">
              Near-Real-Time (NRT)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2/60 border border-border-subtle backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase">
              <Shield className="w-3 h-3 text-status-success" />
              <span>Spatial Engine</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-text-primary mt-1">
              PostGIS 1,000m Buffer
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2/60 border border-border-subtle backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase">
              <Flame className="w-3 h-3 text-brand-amber" />
              <span>Asset Context</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold font-mono text-text-primary mt-1">
              Overpass Infrastructure
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Down Scroll Arrow Indicator */}
      <motion.button
        onClick={onExplore}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-text-muted hover:text-brand-orange transition-colors flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-widest z-10"
      >
        <span>SCROLL TO EXPLORE</span>
        <ArrowDown className="w-4 h-4" />
      </motion.button>
    </section>
  );
};

