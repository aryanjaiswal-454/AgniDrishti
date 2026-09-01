import React, { useState } from "react";
import { Flame, ArrowRight, Menu, X, Satellite, RotateCcw } from "lucide-react";
import { Button, Badge } from "../../components/ui";

export interface LandingNavProps {
  onEnterCommandCenter: () => void;
  onNavigateSection: (sectionId: string) => void;
  onReplayIntro?: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  onEnterCommandCenter,
  onNavigateSection,
  onReplayIntro,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Signal", href: "signal" },
    { label: "Context", href: "context" },
    { label: "Pipeline", href: "pipeline" },
    { label: "Simulation", href: "simulation" },
    { label: "AI Model", href: "ai-model" },
    { label: "GIS Layers", href: "gis-layers" },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    onNavigateSection(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-void/85 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className="p-2 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange shadow-brand-glow">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg sm:text-xl tracking-tight text-text-primary">
                <span className="text-brand-orange">Agni</span>Drishti
              </span>
              <Badge variant="brand" size="sm">
                AgniDrishti
              </Badge>
            </div>
            <span className="hidden sm:inline-block text-[9px] font-mono tracking-widest text-text-muted uppercase">
              AI-Powered Thermal Intelligence
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-text-secondary">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleLinkClick(link.href)}
              className="hover:text-brand-orange transition-colors tracking-wide hover:underline underline-offset-4"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Action Button & Telemetry Badge */}
        <div className="hidden sm:flex items-center gap-3">
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              title="Replay cinematic intelligence intro"
              aria-label="Replay cinematic intelligence intro"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 hover:bg-surface-3 border border-border-subtle hover:border-brand-orange/40 text-[10px] font-mono text-text-muted hover:text-brand-orange transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay Intro</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-border-subtle text-[10px] font-mono text-intelligence-cyan">
            <Satellite className="w-3 h-3 text-intelligence-cyan animate-pulse" />
            <span>FIRMS NRT Active</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onEnterCommandCenter}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            ENTER COMMAND CENTER
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              title="Replay intro"
              aria-label="Replay intro"
              className="p-1.5 rounded-lg bg-surface-2 border border-border-subtle text-text-muted hover:text-brand-orange"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onEnterCommandCenter}
          >
            LAUNCH
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-surface-2 border-b border-border-normal px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-mono text-text-secondary">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleLinkClick(link.href)}
                className="text-left py-1.5 px-2 rounded hover:bg-surface-3 hover:text-brand-orange transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-border-subtle">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={onEnterCommandCenter}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              ENTER COMMAND CENTER
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

