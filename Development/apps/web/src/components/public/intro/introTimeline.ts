import gsap from "gsap";

export interface CreateTimelineOptions {
  onComplete: () => void;
  reducedMotion?: boolean;
}

export function buildIntroTimeline({
  onComplete,
  reducedMotion = false,
}: CreateTimelineOptions): gsap.core.Timeline {
  // If user prefers reduced motion, create a fast, simple fade timeline (1.2s total)
  if (reducedMotion) {
    const tl = gsap.timeline({
      onComplete,
      defaults: { ease: "none" },
    });

    tl.to("#intro-brand-title", { opacity: 1, duration: 0.3 })
      .to("#intro-brand-tagline", { opacity: 1, duration: 0.3 }, "+=0.1")
      .to("#intro-brand-supporting", { opacity: 1, duration: 0.2 }, "+=0.1")
      .to("#intro-overlay", { opacity: 0, duration: 0.3, delay: 0.2 });

    return tl;
  }

  // Master GSAP Timeline synced with audio
  const tl = gsap.timeline({
    onComplete,
    defaults: { ease: "power2.out" },
  });

  // 0.00s - 0.15s: Initial system ignition
  tl.set("#intro-overlay", { opacity: 1 })
    .set("#intro-signal-core", { opacity: 0, scale: 0.6 })
    .set("#intro-brand-title", { opacity: 0, y: 12 })
    .set("#intro-brand-tagline", { opacity: 0, y: 10 })
    .set("#intro-brand-supporting", { opacity: 0, y: 8 })
    .set("#intro-telemetry-layer", { opacity: 0 });

  // 0.15s: Voiceover speaks "AgniDrishti." -> Immediate brand title & thermal beacon reveal
  tl.to(
    "#intro-signal-core",
    {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: "back.out(1.7)",
    },
    0.15
  )
    .to(
      "#intro-signal-glow",
      {
        opacity: 0.8,
        scale: 1,
        duration: 0.5,
      },
      0.15
    )
    .to(
      "#intro-signal-ring-inner",
      {
        opacity: 0.6,
        scale: 1.1,
        duration: 0.6,
      },
      0.2
    )
    .to(
      "#intro-signal-ring-outer",
      {
        opacity: 0.4,
        scale: 1.2,
        duration: 0.8,
      },
      0.25
    )
    .to(
      "#intro-brand-title",
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      },
      0.2
    )
    .to(
      "#intro-signal-coords",
      {
        opacity: 1,
        duration: 0.4,
      },
      0.35
    );

  // 1.30s: Voiceover speaks "AI-powered thermal intelligence." -> Telemetry grid & contextual layers expand
  tl.to(
    "#intro-telemetry-layer",
    {
      opacity: 1,
      duration: 0.8,
      ease: "power2.inOut",
    },
    1.3
  )
    .to(
      "#intro-brand-tagline",
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: "power2.out",
      },
      1.4
    )
    .to(
      "#intro-signal-ring-outer",
      {
        scale: 1.45,
        opacity: 0.25,
        duration: 1.5,
        repeat: 1,
        yoyo: true,
      },
      1.5
    );

  // 3.50s: Voice finishes -> Reveal supporting line (unvoiced) and illuminate full lockup
  tl.to(
    "#intro-brand-supporting",
    {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out",
    },
    3.5
  )
    .to(
      "#intro-signal-glow",
      {
        opacity: 1,
        scale: 1.2,
        duration: 0.5,
      },
      3.6
    );

  // 4.30s - 4.80s: Seamless exit transition into the existing landing hero
  tl.to(
    "#intro-overlay",
    {
      opacity: 0,
      scale: 1.02,
      duration: 0.55,
      ease: "power2.inOut",
    },
    4.3
  );

  return tl;
}

