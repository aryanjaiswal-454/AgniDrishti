import React from "react";
import { Radio } from "lucide-react";

export const IntroSignal: React.FC = () => {
  return (
    <div id="intro-signal-node" className="relative flex flex-col items-center justify-center pointer-events-none select-none z-10">
      {/* Outer Radiative Bloom Rings */}
      <div id="intro-signal-glow" className="absolute -inset-16 rounded-full bg-brand-orange/15 blur-2xl opacity-0 scale-50" />
      
      <div id="intro-signal-ring-outer" className="absolute w-36 h-36 rounded-full border border-brand-orange/20 opacity-0 scale-75" />
      <div id="intro-signal-ring-inner" className="absolute w-24 h-24 rounded-full border border-brand-orange/40 opacity-0 scale-50" />
      
      {/* Thermal Core Node */}
      <div id="intro-signal-core" className="relative p-3 rounded-2xl bg-surface-2/90 border border-brand-orange/60 shadow-brand-glow opacity-0 scale-50">
        <img src="/logo.png" alt="AgniDrishti Logo" className="w-6 h-6 object-contain" />
      </div>

      {/* Coordinate & Simulation Label HUD */}
      <div id="intro-signal-coords" className="mt-4 flex flex-col items-center space-y-1 text-center font-mono opacity-0">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-2/90 border border-border-subtle text-[10px] text-intelligence-cyan">
          <Radio className="w-3 h-3 text-brand-orange animate-ping" />
          <span>22.4707° N, 70.0577° E</span>
        </div>
        <div className="text-[9px] uppercase tracking-widest text-text-muted/80">
          DEMO SIGNAL &bull; VIIRS 375m
        </div>
      </div>
    </div>
  );
};

