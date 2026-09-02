import React, { useState, useEffect } from "react";
import { Activity, Radio, Satellite, ShieldCheck } from "lucide-react";

export const StatusStrip: React.FC = () => {
  const [timeUtc, setTimeUtc] = useState("");
  const [timeIst, setTimeIst] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().slice(11, 19) + " UTC");
      setTimeIst(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " IST"
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full bg-surface border-t border-border-subtle px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-text-muted select-none gap-2 z-[2000]">
      {/* Left: Pipeline Telemetry */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0" />
          <span className="text-text-secondary font-semibold">SYSTEM OPERATIONAL</span>
        </div>

        <div className="hidden md:flex items-center gap-3 border-l border-border-subtle pl-4">
          <div className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-brand-orange" />
            <span>FIRMS NRT: Active (30m)</span>
          </div>
          <div className="flex items-center gap-1">
            <Satellite className="w-3.5 h-3.5 text-intelligence-cyan" />
            <span>Sensors: VIIRS + MODIS</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            <span>OSM Layer: Synced</span>
          </div>
        </div>
      </div>

      {/* Right: Live Clocks */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-brand-amber" />
          <span className="text-text-primary">{timeIst}</span>
          <span className="text-text-muted">({timeUtc})</span>
        </div>
        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-surface-2 border border-border-subtle text-[10px] text-text-muted">
          AGNIDRISHTI
        </span>
      </div>
    </footer>
  );
};

