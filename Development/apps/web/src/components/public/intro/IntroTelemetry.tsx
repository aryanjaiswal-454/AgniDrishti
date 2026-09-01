import React from "react";

export const IntroTelemetry: React.FC = () => {
  return (
    <div id="intro-telemetry-layer" className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-0">
      {/* Tactical Geographic Grid Lines */}
      <div className="absolute inset-0 bg-tactical-grid opacity-15" />

      {/* Atmospheric Haze Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial-gradient from-brand-orange/10 via-intelligence-cyan/5 to-transparent blur-3xl rounded-full" />

      {/* Concentric Geospatial Orbit Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-border-subtle/30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-brand-orange/15 border-dashed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-intelligence-cyan/20" />

      {/* Coordinate Axis Lines */}
      <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-border-subtle/20" />
      <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-border-subtle/20" />

      {/* Corner Telemetry Readouts */}
      <div className="absolute top-8 left-8 text-[10px] font-mono text-text-muted/60 space-y-0.5">
        <div>SYS_ACT: LATENCY &lt; 500MS</div>
        <div>REGION: INDIA SUB-CONTINENT (6.5°N–38.5°N)</div>
      </div>

      <div className="absolute bottom-8 left-8 text-[10px] font-mono text-text-muted/60 space-y-0.5">
        <div>ORBIT: VIIRS NOAA-20 / SNPP (375m)</div>
        <div>POSTGIS GiST R-TREE: INDEXED</div>
      </div>

      <div className="absolute bottom-8 right-8 text-[10px] font-mono text-text-muted/60 text-right space-y-0.5">
        <div>AGNIDRISHTI &bull; DISASTER MGMT</div>
        <div>SIMULATION PREVIEW</div>
      </div>
    </div>
  );
};

