import React from "react";
import { Flame } from "lucide-react";
import { Badge } from "../../components/ui";

export interface LandingFooterProps {
  onNavigate: (route: string) => void;
  onReplayIntro?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigate,
  onReplayIntro,
}) => {
  return (
    <footer className="w-full bg-void border-t border-border-subtle py-12 px-4 sm:px-6 lg:px-8 text-xs font-mono text-text-muted">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Meta */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-text-primary">
                <span className="text-brand-orange">Agni</span>Drishti
              </span>
              <Badge variant="brand" size="sm">
                SIH26162
              </Badge>
            </div>
            <span className="text-[10px] text-text-muted">
              AI-Powered Thermal Intelligence • NTRO / Disaster Management
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-6">
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="hover:text-brand-orange transition-colors text-brand-amber/80"
            >
              Replay Introduction
            </button>
          )}
          <button
            onClick={() => onNavigate("/login")}
            className="hover:text-brand-orange transition-colors"
          >
            Command Center Login
          </button>
          <button
            onClick={() => onNavigate("/design-system")}
            className="hover:text-brand-orange transition-colors"
          >
            Design System Specs
          </button>
          <button
            onClick={() => onNavigate("/help")}
            className="hover:text-brand-orange transition-colors"
          >
            Operations Manual
          </button>
        </div>

        {/* Copyright & Hackathon Info */}
        <div className="text-right text-[10px] text-text-muted space-y-0.5">
          <div>Smart India Hackathon 2026 • Problem Statement SIH26162</div>
          <div>Built with React, Vite, Node.js, PostGIS & PyTorch</div>
        </div>
      </div>
    </footer>
  );
};

