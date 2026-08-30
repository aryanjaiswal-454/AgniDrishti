import React, { useEffect, useRef } from "react";

interface HotspotNode {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  pulseSpeed: number;
  color: string;
  label?: string;
}

export const GeospatialCanvas: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Simulated satellite/thermal anchor points (India geographic coordinates perspective)
    const hotspots: HotspotNode[] = [
      { x: 0.38, y: 0.44, radius: 4.5, baseAlpha: 0.85, pulseSpeed: 0.035, color: "#FF5722", label: "JAMNAGAR REFINERY" },
      { x: 0.52, y: 0.46, radius: 3.5, baseAlpha: 0.7, pulseSpeed: 0.025, color: "#FFA726", label: "BINA COMPLEX" },
      { x: 0.62, y: 0.50, radius: 4.0, baseAlpha: 0.8, pulseSpeed: 0.03, color: "#00E5FF", label: "KORBA BASIN" },
      { x: 0.58, y: 0.62, radius: 3.0, baseAlpha: 0.6, pulseSpeed: 0.02, color: "#FF5722", label: "VIZAG PETRO" },
      { x: 0.44, y: 0.35, radius: 2.5, baseAlpha: 0.5, pulseSpeed: 0.015, color: "#FFA726", label: "BARMER INDUSTRIAL" },
    ];

    // Background floating data particles
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.48;

      // 1. Draw subtle concentric orbital tracking arcs
      ctx.save();
      const orbitCount = 4;
      for (let i = 1; i <= orbitCount; i++) {
        const rx = width * 0.28 * i * 0.75;
        const ry = height * 0.24 * i * 0.65;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, -0.15, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 87, 34, ${0.03 + (i === 2 ? 0.03 : 0.01)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash(i % 2 === 0 ? [6, 12] : [4, 8]);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw satellite orbital flight vectors
      ctx.save();
      const satAngle1 = (time * 0.2) % (Math.PI * 2);
      const satR1x = width * 0.35;
      const satR1y = height * 0.25;
      const satX = cx + Math.cos(satAngle1) * satR1x;
      const satY = cy + Math.sin(satAngle1) * satR1y;

      // Satellite glow beacon
      const satGrad = ctx.createRadialGradient(satX, satY, 0, satX, satY, 18);
      satGrad.addColorStop(0, "rgba(0, 229, 255, 0.8)");
      satGrad.addColorStop(0.4, "rgba(0, 229, 255, 0.2)");
      satGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
      ctx.fillStyle = satGrad;
      ctx.beginPath();
      ctx.arc(satX, satY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Satellite core
      ctx.fillStyle = "#00E5FF";
      ctx.beginPath();
      ctx.arc(satX, satY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Satellite beam cone to center
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(cx + (hotspots[0].x - 0.5) * width * 0.7, cy + (hotspots[0].y - 0.5) * height * 0.7);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.restore();

      // 3. Draw background telemetry particles
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
          if (p.y < 0) p.y = 1;
          if (p.y > 1) p.y = 0;
        }

        ctx.fillStyle = `rgba(160, 180, 200, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw coordinate grid lines (tactical geospatial aesthetic)
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
      ctx.lineWidth = 1;
      const stepX = width / 12;
      const stepY = height / 10;
      for (let x = stepX; x < width; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = stepY; y < height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Draw active thermal hotspot beacons
      for (const hs of hotspots) {
        const hx = width * hs.x;
        const hy = height * hs.y;
        const pulse = prefersReducedMotion ? 1 : Math.sin(time * 3 * hs.pulseSpeed * 10) * 0.5 + 0.5;
        const outerRadius = hs.radius * 3.5 + pulse * 10;

        // Outer glow
        const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, outerRadius);
        glow.addColorStop(0, `${hs.color}88`);
        glow.addColorStop(0.5, `${hs.color}22`);
        glow.addColorStop(1, `${hs.color}00`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(hx, hy, outerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = hs.color;
        ctx.beginPath();
        ctx.arc(hx, hy, hs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing radar ring
        ctx.strokeStyle = `${hs.color}${Math.floor((1 - pulse) * 120).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hx, hy, hs.radius + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();

        // Optional tactical coordinate label on desktop
        if (width > 768 && hs.label) {
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillStyle = "rgba(160, 175, 195, 0.5)";
          ctx.fillText(hs.label, hx + 10, hy - 4);
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-0 ${className || ""}`}
    />
  );
};

