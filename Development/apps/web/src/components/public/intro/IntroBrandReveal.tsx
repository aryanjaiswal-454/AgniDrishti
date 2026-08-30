import React from "react";

export const IntroBrandReveal: React.FC = () => {
  return (
    <div id="intro-brand-lockup" className="relative z-20 flex flex-col items-center text-center select-none mt-6 space-y-3">
      {/* Product Wordmark */}
      <h1
        id="intro-brand-title"
        className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-text-primary leading-[1.05] opacity-0"
      >
        <span className="text-brand-orange">AGNI</span>DRISHTI
      </h1>

      {/* Subtitle / Tagline */}
      <div id="intro-brand-tagline" className="opacity-0 space-y-1">
        <p className="text-sm sm:text-xl font-mono font-semibold tracking-[0.2em] text-intelligence-cyan uppercase">
          AI-Powered Thermal Intelligence
        </p>
      </div>

      {/* Supporting Line (Visual Only - Unspoken) */}
      <div id="intro-brand-supporting" className="opacity-0 pt-1">
        <p className="text-xs sm:text-sm font-mono text-text-muted tracking-[0.25em] uppercase">
          Detect &middot; Classify &middot; Monitor
        </p>
      </div>
    </div>
  );
};

