import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Flame, Building2, Layers, AlertTriangle, ShieldCheck, Activity, Info, Crosshair, ArrowRight } from "lucide-react";
import { Card, Badge, Button } from "../../components/ui";

interface SimEvent {
  id: string;
  name: string;
  facility: string;
  facilityType: string;
  state: string;
  coords: string;
  frp: number;
  temp: number;
  classification: "industrial_fire" | "gas_flare" | "forest_fire";
  classificationLabel: string;
  confidence: number;
  distanceM: number;
  recurrence: string;
  anomalySigma: string;
  landCover: string;
  severity: "critical" | "warning" | "default";
  statusText: string;
  x: number; // percentage in radar map
  y: number;
}

const SIMULATED_EVENTS: SimEvent[] = [
  {
    id: "SIM-01",
    name: "Jamnagar Secondary Unit 4",
    facility: "Reliance Jamnagar Complex",
    facilityType: "Oil & Gas Refinery",
    state: "Gujarat",
    coords: "22.4707° N, 70.0577° E",
    frp: 184.2,
    temp: 367.4,
    classification: "industrial_fire",
    classificationLabel: "Industrial Fire",
    confidence: 92,
    distanceM: 320,
    recurrence: "2 / 90 days",
    anomalySigma: "+4.1σ Anomaly",
    landCover: "Built / Heavy Industrial",
    severity: "critical",
    statusText: "UNCONTROLLED ANOMALY — ESCALATED",
    x: 28,
    y: 46,
  },
  {
    id: "SIM-02",
    name: "Bina Flare Stack Alpha",
    facility: "Bharat Oman Refineries (BORL)",
    facilityType: "Petrochemical Refinery",
    state: "Madhya Pradesh",
    coords: "24.1812° N, 78.1924° E",
    frp: 46.8,
    temp: 334.1,
    classification: "gas_flare",
    classificationLabel: "Gas Flare (Routine)",
    confidence: 96,
    distanceM: 45,
    recurrence: "86 / 90 days",
    anomalySigma: "+0.3σ Normal",
    landCover: "Industrial Complex",
    severity: "warning",
    statusText: "MONITORED BASELINE — NO THREAT",
    x: 52,
    y: 42,
  },
  {
    id: "SIM-03",
    name: "Korba Super Thermal Power",
    facility: "NTPC Korba Thermal Power",
    facilityType: "Coal Power Generation",
    state: "Chhattisgarh",
    coords: "22.3595° N, 82.6841° E",
    frp: 78.4,
    temp: 348.6,
    classification: "gas_flare",
    classificationLabel: "Persistent Thermal Source",
    confidence: 89,
    distanceM: 110,
    recurrence: "79 / 90 days",
    anomalySigma: "+0.8σ Baseline",
    landCover: "Industrial Infrastructure",
    severity: "default",
    statusText: "PERSISTENT OPERATION — VERIFIED",
    x: 64,
    y: 48,
  },
  {
    id: "SIM-04",
    name: "Satpura Tiger Reserve Ridge",
    facility: "None (Buffer Cleared)",
    facilityType: "Protected Forest Reserve",
    state: "Madhya Pradesh",
    coords: "22.4500° N, 78.2500° E",
    frp: 142.0,
    temp: 359.2,
    classification: "forest_fire",
    classificationLabel: "Natural Forest Fire",
    confidence: 94,
    distanceM: 14200,
    recurrence: "0 / 90 days",
    anomalySigma: "Non-Industrial",
    landCover: "Dense Deciduous Forest",
    severity: "warning",
    statusText: "ROUTED TO STATE FOREST DEPT",
    x: 56,
    y: 56,
  },
];

export const LiveSimulationMapSection: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>("SIM-01");
  const selectedEvent = SIMULATED_EVENTS.find((e) => e.id === selectedEventId) || SIMULATED_EVENTS[0];

  return (
    <section id="simulation" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-surface/40 border-t border-border-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header with Mandatory Disclaimer Badge */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-status-critical/15 border border-status-critical/30 text-[11px] font-mono text-status-critical uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-status-critical animate-ping" />
            <span>SIMULATION — LIVE PIPELINE PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            Interactive Intelligence <span className="text-brand-orange italic font-serif">Simulation</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-text-muted">
            Select any simulated anomaly to inspect how raw thermal telemetry is enriched and classified by the pipeline.
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Simulated Radar / Map Viewport */}
          <div className="lg:col-span-7">
            <Card className="relative p-4 sm:p-6 bg-surface-2/90 border-border-normal overflow-hidden shadow-2xl">
              {/* Map Header Status */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-brand-orange" />
                  <span className="text-xs font-mono font-semibold text-text-primary">
                    SIMULATED NATIONAL SURVEILLANCE RADAR
                  </span>
                </div>
                <Badge variant="cyan" size="sm">
                  4 Active Hotspots
                </Badge>
              </div>

              {/* Tactical Radar Surface */}
              <div className="relative aspect-[16/10] w-full rounded-xl bg-void/90 border border-border-subtle overflow-hidden flex items-center justify-center select-none">
                {/* Radar Grid Lines */}
                <div className="absolute inset-0 bg-tactical-grid opacity-30" />
                
                {/* Range Rings */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-border-subtle/40 pointer-events-none" />
                <div className="absolute w-[50%] h-[50%] rounded-full border border-border-subtle/60 pointer-events-none" />
                <div className="absolute w-[20%] h-[20%] rounded-full border border-brand-orange/20 pointer-events-none" />

                {/* Sweeping Radar Line */}
                <div className="absolute inset-0 origin-center animate-spin pointer-events-none" style={{ animationDuration: "12s" }}>
                  <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent via-brand-orange/30 to-brand-orange/80" />
                </div>

                {/* Simulated Geographic Labels */}
                <span className="absolute top-4 left-6 text-[10px] font-mono text-text-muted/60">
                  SECTOR WEST • 22°N
                </span>
                <span className="absolute bottom-4 right-6 text-[10px] font-mono text-text-muted/60">
                  SECTOR EAST • 82°E
                </span>

                {/* Interactive Hotspot Nodes */}
                {SIMULATED_EVENTS.map((evt) => {
                  const isSelected = evt.id === selectedEventId;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      style={{ top: `${evt.y}%`, left: `${evt.x}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-10"
                    >
                      {/* Pulse Wave */}
                      <span
                        className={`absolute -inset-3 rounded-full animate-ping opacity-60 ${
                          evt.severity === "critical"
                            ? "bg-status-critical"
                            : evt.severity === "warning"
                            ? "bg-brand-orange"
                            : "bg-intelligence-cyan"
                        }`}
                      />

                      {/* Node Beacon */}
                      <div
                        className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                          isSelected ? "scale-125 ring-2 ring-white" : "scale-100 group-hover:scale-110"
                        } ${
                          evt.severity === "critical"
                            ? "bg-status-critical shadow-glow-critical text-white"
                            : evt.severity === "warning"
                            ? "bg-brand-orange shadow-brand-glow text-void"
                            : "bg-intelligence-cyan text-void"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                      </div>

                      {/* Tooltip Tag */}
                      <div
                        className={`absolute top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap border shadow-md transition-opacity ${
                          isSelected
                            ? "bg-surface-3 border-brand-orange text-text-primary opacity-100 font-bold"
                            : "bg-surface-2 border-border-subtle text-text-secondary opacity-70 group-hover:opacity-100"
                        }`}
                      >
                        {evt.id}: {evt.classificationLabel}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-brand-amber" />
                  Click any hotspot beacon to deconstruct real-time pipeline inference.
                </span>
                <span className="text-[10px] uppercase text-text-muted/70">
                  DEMO DATASET • AGNIDRISHTI
                </span>
              </div>
            </Card>
          </div>

          {/* Right: Live Telemetry Deconstruction Inspector */}
          <div className="lg:col-span-5">
            <Card className="p-6 bg-surface-2/95 border-brand-orange/40 backdrop-blur-md shadow-2xl space-y-6">
              {/* Event Header */}
              <div className="space-y-2 border-b border-border-subtle pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">
                    EVENT TELEMETRY INSPECTOR
                  </span>
                  <Badge
                    variant={
                      selectedEvent.severity === "critical"
                        ? "critical"
                        : selectedEvent.severity === "warning"
                        ? "brand"
                        : "cyan"
                    }
                    size="sm"
                    dot
                  >
                    {selectedEvent.id}
                  </Badge>
                </div>
                <h3 className="text-xl font-display font-bold text-text-primary">
                  {selectedEvent.name}
                </h3>
                <div className="text-xs font-mono text-intelligence-cyan">
                  {selectedEvent.facility} ({selectedEvent.state})
                </div>
              </div>

              {/* 6-Step Deconstruction Flow */}
              <div className="space-y-3 font-mono text-xs">
                {/* Step 1: Raw Signal */}
                <div className="p-3 rounded-lg bg-surface-3/70 border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-brand-orange" />
                    <div>
                      <span className="text-[10px] text-text-muted block">1. RAW SATELLITE SIGNAL</span>
                      <span className="font-semibold text-text-primary">{selectedEvent.coords}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-orange">{selectedEvent.frp} MW</div>
                    <div className="text-[10px] text-text-muted">{selectedEvent.temp} K</div>
                  </div>
                </div>

                {/* Step 2: Facility Match */}
                <div className="p-3 rounded-lg bg-surface-3/70 border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-intelligence-cyan" />
                    <div>
                      <span className="text-[10px] text-text-muted block">2. FACILITY MATCH</span>
                      <span className="font-semibold text-text-primary">{selectedEvent.facilityType}</span>
                    </div>
                  </div>
                  <div className="text-right font-semibold text-text-secondary">
                    {selectedEvent.distanceM}m Distance
                  </div>
                </div>

                {/* Step 3: Land Cover */}
                <div className="p-3 rounded-lg bg-surface-3/70 border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-status-success" />
                    <div>
                      <span className="text-[10px] text-text-muted block">3. LAND-COVER RASTER</span>
                      <span className="font-semibold text-text-primary">{selectedEvent.landCover}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>

                {/* Step 4: Historical Check */}
                <div className="p-3 rounded-lg bg-surface-3/70 border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-amber" />
                    <div>
                      <span className="text-[10px] text-text-muted block">4. HISTORICAL BASELINE</span>
                      <span className="font-semibold text-text-primary">Recurrence: {selectedEvent.recurrence}</span>
                    </div>
                  </div>
                  <div className="font-bold text-brand-amber">{selectedEvent.anomalySigma}</div>
                </div>

                {/* Step 5: AI Classification & Final Verdict */}
                <div className="p-4 rounded-xl bg-brand-orange/15 border border-brand-orange/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest">
                      5. AI CLASSIFICATION VERDICT
                    </span>
                    <span className="text-xs font-bold font-mono text-text-primary">
                      {selectedEvent.confidence}% Confidence
                    </span>
                  </div>
                  <div className="text-base font-display font-bold text-text-primary">
                    {selectedEvent.classificationLabel}
                  </div>
                  <div className="text-[11px] text-text-secondary pt-1 border-t border-brand-orange/20">
                    Status: <span className="font-semibold text-text-primary">{selectedEvent.statusText}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

