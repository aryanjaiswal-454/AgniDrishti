import React from "react";
import { motion } from "framer-motion";
import { AlertOctagon, Flame, Trees, Check, X, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Card, Badge } from "../../components/ui";
import { fadeInVariants, staggerContainerVariants } from "../../design-system/motion";

export const ThermalTriageSection: React.FC = () => {
  const categories = [
    {
      id: "industrial_fire",
      title: "Industrial Fire",
      subtitle: "Unplanned Facility Catastrophe",
      badgeText: "IMMEDIATE ESCALATION",
      badgeVariant: "critical" as const,
      icon: <AlertOctagon className="w-6 h-6 text-status-critical" />,
      borderColor: "border-status-critical/40 hover:border-status-critical",
      headerBg: "bg-status-critical/10",
      description: "Severe anomalous thermal spikes located inside refinery perimeters, chemical storage depots, or pipeline terminals with sudden deviation from baseline.",
      features: [
        { label: "Recurrence", val: "0–2 occurrences / 90 days" },
        { label: "FRP Signature", val: "Exceeds baseline by > +3.0σ" },
        { label: "Land Cover", val: "Industrial / Built Infrastructure" },
        { label: "Action", val: "Automated alert dispatch to emergency services" },
      ],
    },
    {
      id: "persistent_source",
      title: "Persistent Thermal Source",
      subtitle: "Routine Industrial Flare & Boiler",
      badgeText: "BASELINE MONITORING",
      badgeVariant: "brand" as const,
      icon: <Flame className="w-6 h-6 text-brand-orange" />,
      borderColor: "border-brand-orange/40 hover:border-brand-orange",
      headerBg: "bg-brand-orange/10",
      description: "Routine elevated operational gas flaring at petrochemical complexes, blast furnaces at steel plants, and coal combustion exhaust.",
      features: [
        { label: "Recurrence", val: "60–90 occurrences / 90 days (High)" },
        { label: "FRP Signature", val: "Matches calibrated facility baseline (±1.0σ)" },
        { label: "Land Cover", val: "Mapped Industrial Stack Geometry" },
        { label: "Action", val: "Logged to emissions & telemetry records" },
      ],
    },
    {
      id: "natural_event",
      title: "Natural / Non-Industrial",
      subtitle: "Stubble Burn & Wildland Fire",
      badgeText: "FORESTRY & AGRI ROUTED",
      badgeVariant: "cyan" as const,
      icon: <Trees className="w-6 h-6 text-intelligence-cyan" />,
      borderColor: "border-intelligence-cyan/40 hover:border-intelligence-cyan",
      headerBg: "bg-intelligence-cyan/10",
      description: "Post-harvest crop residue burning in agricultural belts or seasonal wildland fires across national parks, distinct from infrastructure.",
      features: [
        { label: "Recurrence", val: "Seasonal / Ephemeral cluster" },
        { label: "FRP Signature", val: "Variable spread, large spatial area" },
        { label: "Land Cover", val: "Cropland, Shrubland, or Forest Canopy" },
        { label: "Action", val: "Routed to Ministry of Environment & Agriculture" },
      ],
    },
  ];

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-void border-t border-border-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-brand-orange uppercase">
            <span>04 • OPERATIONAL TAXONOMY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            Not every thermal event is an <span className="text-status-critical italic font-serif">emergency</span>.
          </h2>
          <p className="text-sm sm:text-base font-mono text-text-muted">
            AgniDrishti separates high-stakes emergencies from routine operational heat sources with algorithmic precision.
          </p>
        </div>

        {/* 3 Categories Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={fadeInVariants} className="h-full">
              <Card className={`h-full p-6 bg-surface-2/80 border ${cat.borderColor} backdrop-blur-md flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-lg`}>
                <div className="space-y-4">
                  {/* Category Top Banner */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${cat.headerBg} border border-border-subtle`}>
                      {cat.icon}
                    </div>
                    <Badge variant={cat.badgeVariant} size="sm">
                      {cat.badgeText}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-bold text-text-primary">
                      {cat.title}
                    </h3>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
                    {cat.description}
                  </p>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 pt-4 border-t border-border-subtle/80 font-mono text-xs">
                    {cat.features.map((f, fIdx) => (
                      <div key={fIdx} className="space-y-0.5">
                        <div className="text-[10px] text-text-muted uppercase">{f.label}</div>
                        <div className="font-semibold text-text-primary flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                          <span>{f.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

