import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { IntelligenceIntroProps } from "./types";
import { IntroSoundControl } from "./IntroSoundControl";
import { IntroSkip } from "./IntroSkip";
import { IntroSignal } from "./IntroSignal";
import { IntroTelemetry } from "./IntroTelemetry";
import { IntroBrandReveal } from "./IntroBrandReveal";
import { buildIntroTimeline } from "./introTimeline";

export const IntelligenceIntro: React.FC<IntelligenceIntroProps> = ({
  onComplete,
  onSkip,
  isReplay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem("agnidrishti_sound_muted");
    return saved ? saved === "true" : false;
  });
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  // Safe teardown handler
  const handleFinish = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    onComplete();
  }, [onComplete]);

  // Skip handler
  const handleSkip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  }, [onSkip, onComplete]);

  // Sound toggle handler
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      localStorage.setItem("agnidrishti_sound_muted", String(nextMuted));
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
        if (!nextMuted && audioRef.current.paused) {
          audioRef.current.play().catch(() => {
            // Browser still blocked; ignore
          });
        }
      }
      setAutoplayBlocked(false);
      return nextMuted;
    });
  }, []);

  // Main lifecycle: audio autoplay & GSAP master timeline
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Audio initialization
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.muted = isMuted;

      // Attempt audio playback
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked by browser policy
          setAutoplayBlocked(true);
          setIsMuted(true);
        });
      }
    }

    // 2. Master GSAP timeline initialization
    const tl = buildIntroTimeline({
      onComplete: handleFinish,
      reducedMotion: prefersReducedMotion,
    });
    timelineRef.current = tl;

    // 3. Keyboard handler for Escape -> Skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [handleFinish, handleSkip, isReplay]);

  return (
    <div
      id="intro-overlay"
      className="fixed inset-0 z-50 bg-void flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="/audio/agnidrishti-intro.mp3"
        preload="auto"
        playsInline
      />

      {/* Top Bar Controls */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-30">
        <div className="text-[10px] font-mono text-text-muted/60 tracking-wider">
          AGNIDRISHTI &bull; SYSTEM INITIALIZATION
        </div>

        <div className="flex items-center gap-3">
          <IntroSoundControl
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            autoplayBlocked={autoplayBlocked}
          />
          <IntroSkip onSkip={handleSkip} />
        </div>
      </header>

      {/* Center Stage: Telemetry Grid, Signal Beacon & Brand Lockup */}
      <main className="relative w-full max-w-3xl flex-1 flex flex-col items-center justify-center z-20">
        <IntroTelemetry />
        <IntroSignal />
        <IntroBrandReveal />
      </main>

      {/* Footer Status Hint */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between text-[10px] font-mono text-text-muted/50 z-30">
        <div>SIH26162 &bull; NATIONAL SURVEILLANCE</div>
        <div>PRESS ESC TO SKIP</div>
      </footer>
    </div>
  );
};

