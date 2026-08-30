import React, { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { SignalSection } from "./SignalSection";
import { ContextEnrichmentSection } from "./ContextEnrichmentSection";
import { PipelineArchitectureSection } from "./PipelineArchitectureSection";
import { LiveSimulationMapSection } from "./LiveSimulationMapSection";
import { ThermalTriageSection } from "./ThermalTriageSection";
import { AiClassificationSection } from "./AiClassificationSection";
import { GisLayerSection } from "./GisLayerSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { LandingFooter } from "./LandingFooter";
import { IntelligenceIntro } from "../../components/public/intro";
import { useAuth } from "../../context/AuthContext";

export interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const lenisRef = useRef<Lenis | null>(null);

  // Cinematic Intro state - auto-play once per browser session
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      const seen = sessionStorage.getItem("agnidrishti_intro_seen");
      return seen !== "true";
    } catch {
      return true;
    }
  });
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    // Respect user's reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -70 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleEnterCommandCenter = () => {
    if (user) {
      onNavigate("/command-center");
    } else {
      onNavigate("/login");
    }
  };

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem("agnidrishti_intro_seen", "true");
    } catch {
      // Ignore sessionStorage errors in private mode
    }
    setShowIntro(false);
    setIsReplaying(false);
  };

  const handleReplayIntro = () => {
    setIsReplaying(true);
    setShowIntro(true);
  };

  return (
    <div className="min-h-screen w-full bg-void text-text-primary overflow-x-hidden selection:bg-brand-orange/30 selection:text-brand-amber">
      {/* Full-Screen Cinematic Intelligence Intro Overlay */}
      {showIntro && (
        <IntelligenceIntro
          onComplete={handleIntroComplete}
          onSkip={handleIntroComplete}
          isReplay={isReplaying}
        />
      )}

      {/* Fixed Navigation Header */}
      <LandingNav
        onEnterCommandCenter={handleEnterCommandCenter}
        onNavigateSection={handleNavigateSection}
        onReplayIntro={handleReplayIntro}
      />

      <main className="w-full">
        {/* Full-Screen Cinematic Hero */}
        <HeroSection
          onExplore={() => handleNavigateSection("signal")}
          onEnterCommandCenter={handleEnterCommandCenter}
        />

        {/* Section 1: The Raw Signal Ambiguity Problem */}
        <SignalSection />

        {/* Section 2: Context Changes Everything (4 Data Vectors) */}
        <ContextEnrichmentSection />

        {/* Section 3: Architecture & Ingestion Pipeline */}
        <PipelineArchitectureSection />

        {/* Section 4: Live Simulated Intelligence Preview */}
        <LiveSimulationMapSection />

        {/* Section 5: Operational Taxonomy (3 Categories) */}
        <ThermalTriageSection />

        {/* Section 6: Machine Learning Feature Decomposition */}
        <AiClassificationSection />

        {/* Section 7: Multi-Layer GIS Spatial Stack */}
        <GisLayerSection />

        {/* Final Conversion CTA Beacon */}
        <FinalCtaSection onEnterCommandCenter={handleEnterCommandCenter} />
      </main>

      {/* Public Footer */}
      <LandingFooter onNavigate={onNavigate} onReplayIntro={handleReplayIntro} />
    </div>
  );
};

export default LandingPage;

