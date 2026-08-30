import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCreatedPayload } from "./events";
import { AlertTriangle, ArrowRight, X, Building2, Flame, Crosshair } from "lucide-react";

export interface AlertToastProps {
  alert: AlertCreatedPayload;
  onDismiss: (id: string) => void;
  onNavigate: (route: string) => void;
  autoDismissMs?: number;
}

/**
 * Synthesize a restrained, subtle audio cue for high-priority alerts via Web Audio API.
 * Quiet and non-intrusive (no external MP3 asset needed).
 */
function playSubtleAlertCue(): void {
  try {
    if (typeof window === "undefined" || !window.AudioContext && !(window as any).webkitAudioContext) {
      return;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();

    // Gentle two-tone chime (440Hz -> 587.33Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.12);

    // Very quiet volume (0.05 max gain)
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

export const AlertToast: React.FC<AlertToastProps> = ({
  alert,
  onDismiss,
  onNavigate,
  autoDismissMs = 10000,
}) => {
  // Play subtle cue on mount
  useEffect(() => {
    playSubtleAlertCue();
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(alert.id);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [alert.id, autoDismissMs, onDismiss]);

  const event = alert.event;
  const subClassLabel = event?.sub_class
    ? event.sub_class.replace(/_/g, " ").toUpperCase()
    : "THERMAL ANOMALY";

  const handleAction = () => {
    onDismiss(alert.id);
    if (alert.classified_event_id) {
      onNavigate(`/events/${alert.classified_event_id}`);
    } else {
      onNavigate("/alerts");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      role="alert"
      aria-atomic="true"
      className="w-full max-w-sm sm:max-w-md rounded-xl bg-surface/95 backdrop-blur-xl border border-status-critical/40 shadow-2xl p-4 font-mono text-xs text-text-primary overflow-hidden relative"
      data-testid={`alert-toast-${alert.id}`}
    >
      {/* Critical Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-status-critical via-brand-orange to-status-critical animate-pulse" />

      {/* Top Strip */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-critical opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-critical" />
          </span>
          <span className="font-bold text-status-critical tracking-wider uppercase text-[11px]">
            High Priority Threat Alert
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          aria-label="Dismiss alert notification"
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Alert Description */}
      <div className="space-y-1 mb-3">
        <div className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-brand-orange shrink-0" />
          <span>{subClassLabel}</span>
        </div>

        {event?.facility_name && (
          <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-intelligence-cyan shrink-0" />
            <span className="truncate">{event.facility_name}</span>
          </div>
        )}

        {/* Telemetry Chips */}
        <div className="flex items-center gap-2 pt-1 text-[10px] text-text-muted">
          {event?.frp !== undefined && event.frp !== null && (
            <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-subtle text-brand-orange font-bold">
              {event.frp} MW
            </span>
          )}
          {event?.confidence_score !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-subtle text-brand-amber font-bold">
              {Math.round(event.confidence_score * 100)}% CONF
            </span>
          )}
          {event?.latitude !== undefined && event?.longitude !== undefined && (
            <span className="hidden sm:inline text-text-muted font-mono">
              {event.latitude.toFixed(2)}°, {event.longitude.toFixed(2)}°
            </span>
          )}
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
        <span className="text-[10px] text-text-muted">
          {new Date(alert.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>

        <button
          type="button"
          onClick={handleAction}
          className="flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:text-brand-amber transition-colors px-2 py-1 rounded bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/30"
        >
          <span>VIEW INVESTIGATION</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

