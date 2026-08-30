import React from "react";
import { ArrowRight } from "lucide-react";

export interface IntroSkipProps {
  onSkip: () => void;
}

export const IntroSkip: React.FC<IntroSkipProps> = ({ onSkip }) => {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Skip cinematic introduction"
      className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-2/80 hover:bg-surface-3 border border-border-subtle hover:border-brand-orange/40 backdrop-blur-md text-xs font-mono text-text-secondary hover:text-brand-orange transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange select-none"
    >
      <span className="text-[11px] tracking-widest uppercase">Skip Intro</span>
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
};

