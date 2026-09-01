import React from "react";
import { motion } from "framer-motion";
import { Flame, ArrowRight, ShieldCheck, Satellite, Terminal } from "lucide-react";
import { Button, Card, Badge } from "../../components/ui";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export interface FinalCtaSectionProps {
  onEnterCommandCenter: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onEnterCommandCenter,
}) => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-void overflow-hidden border-t border-border-subtle select-none">
      {/* Background glow and beacon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-orange/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainerVariants}
        className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
      >
        {/* National Operational Status Badge */}
        <motion.div variants={fadeInVariants} className="inline-flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-brand-orange/40 text-xs font-mono text-brand-orange shadow-brand-glow">
            <ShieldCheck className="w-4 h-4 text-brand-orange" />
            <span>OPERATIONAL READINESS • AGNIDRISHTI</span>
          </div>
        </motion.div>

        {/* Closing High-Impact Headline */}
        <motion.div variants={fadeInVariants} className="space-y-4">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-text-primary uppercase leading-[1.1]">
            The planet is always <br />
            <span className="text-text-muted">generating signals.</span>
            <br />
            <span className="text-brand-orange">AgniDrishti</span> makes them <br />
            <span className="text-intelligence-cyan italic font-serif lowercase">understandable.</span>
          </h2>
        </motion.div>

        <motion.p
          variants={fadeInVariants}
          className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto font-sans font-light"
        >
          Access the real-time AI command center for comprehensive thermal threat monitoring, facility risk analysis, and alert triage.
        </motion.p>

        {/* Primary Command Center Access CTA */}
        <motion.div variants={fadeInVariants} className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onEnterCommandCenter}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto text-sm sm:text-base font-mono tracking-wider py-4 px-8 shadow-brand-glow"
          >
            ENTER COMMAND CENTER
          </Button>
        </motion.div>

        {/* Tactical Footer Tag */}
        <motion.div
          variants={fadeInVariants}
          className="pt-12 text-xs font-mono text-text-muted flex items-center justify-center gap-4"
        >
          <span className="flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-intelligence-cyan" />
            NASA FIRMS Pipeline: Online
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-brand-orange" />
            RBAC Protected Session
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
};

