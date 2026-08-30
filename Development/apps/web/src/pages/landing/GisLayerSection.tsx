import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Flame, Building2, Map, History, Check, Eye } from "lucide-react";
import { Card, Badge, Button } from "../../components/ui";

interface GisLayer {
  id: string;
  name: string;
  type: string;
  source: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  visualPreview: string;
}

export const GisLayerSection: React.FC = () => {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    thermal: true,
    facilities: true,
    landcover: true,
    history: true,
  });

  const toggleLayer = (layerId: string) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const layers: GisLayer[] = [
    {
      id: "thermal",
      name: "NASA FIRMS Hotspots",
      type: "Vector Points (GeoJSON)",
      source: "VIIRS NOAA-20 / MODIS NRT",
      color: "text-brand-orange",
      icon: <Flame className="w-4 h-4 text-brand-orange" />,
      description: "Near real-time 375m thermal radiation points with brightness temperature and Fire Radiative Power (MW).",
      visualPreview: "Pulsating orange thermal points mapped across active industrial coordinates.",
    },
    {
      id: "facilities",
      name: "Industrial Facilities",
      type: "Polygons & Boundaries",
      source: "OpenStreetMap PostGIS",
      color: "text-intelligence-cyan",
      icon: <Building2 className="w-4 h-4 text-intelligence-cyan" />,
      description: "Detailed polygonal footprints for 2,481+ Indian refineries, gas terminals, power plants, steel mills, and coal mines.",
      visualPreview: "Cyan industrial boundary perimeters highlighting critical national infrastructure assets.",
    },
    {
      id: "landcover",
      name: "Dynamic Land Cover",
      type: "10m Raster Categorization",
      source: "Copernicus / Dynamic World",
      color: "text-status-success",
      icon: <Map className="w-4 h-4 text-status-success" />,
      description: "Classifies surrounding surface topology into Built Structures, Croplands, Forest Canopy, or Open Water.",
      visualPreview: "Emerald surface masking differentiating industrial asphalt from agricultural soil.",
    },
    {
      id: "history",
      name: "Historical Thermal Density",
      type: "Rolling Heatmap & Baselines",
      source: "AgniDrishti 90-Day Analytics",
      color: "text-brand-amber",
      icon: <History className="w-4 h-4 text-brand-amber" />,
      description: "Long-term thermal recurrence baselines tracking standard flare operating ranges and standard deviations.",
      visualPreview: "Amber rolling density contours indicating typical flare thermal signatures.",
    },
  ];

  return (
    <section id="gis-layers" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-void border-t border-border-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border-subtle text-[11px] font-mono text-intelligence-cyan uppercase">
            <span>06 • MULTI-LAYER GIS INTELLIGENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
            Spatial Context <span className="text-intelligence-cyan italic font-serif">Layer Stack</span>
          </h2>
          <p className="text-sm sm:text-base font-mono text-text-muted">
            Toggle individual GIS layers to observe how raw satellite telemetry is progressively transformed into actionable intelligence.
          </p>
        </div>

        {/* Interactive Layer Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Layer Toggle Controls */}
          <div className="lg:col-span-5 space-y-3">
            {layers.map((layer) => {
              const isEnabled = activeLayers[layer.id];
              return (
                <div
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                    isEnabled
                      ? "bg-surface-2/95 border-border-active shadow-md"
                      : "bg-surface/40 border-border-subtle opacity-50 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-3 border border-border-subtle">
                        {layer.icon}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm text-text-primary flex items-center gap-2">
                          <span>{layer.name}</span>
                          <span className={`text-[10px] font-mono ${layer.color}`}>
                            ({layer.type})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-text-muted">
                          Source: {layer.source}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isEnabled
                          ? "bg-brand-orange border-brand-orange text-void"
                          : "border-border-normal bg-surface"
                      }`}
                    >
                      {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary mt-2 pl-11 font-sans">
                    {layer.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Simulated Multi-Layer Canvas Stack Preview */}
          <div className="lg:col-span-7">
            <Card className="relative p-6 sm:p-8 bg-surface-2/95 border-intelligence-cyan/30 backdrop-blur-md shadow-2xl overflow-hidden min-h-[440px] flex flex-col justify-between">
              {/* Stack Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle z-10">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-intelligence-cyan" />
                  <span className="text-xs font-mono font-semibold text-text-primary uppercase">
                    COMPOSITE GIS SPATIAL VIEWPORT
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
                  <span>ACTIVE LAYERS:</span>
                  <span className="text-intelligence-cyan font-bold">
                    {Object.values(activeLayers).filter(Boolean).length} / 4
                  </span>
                </div>
              </div>

              {/* Simulated Map Stack Canvas */}
              <div className="relative my-4 flex-1 aspect-[16/9] w-full rounded-xl bg-void border border-border-subtle overflow-hidden flex items-center justify-center select-none">
                {/* Background GIS Grid */}
                <div className="absolute inset-0 bg-tactical-grid opacity-20" />

                {/* Layer 3: Land Cover Raster Layer */}
                {activeLayers.landcover && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-tr from-status-success/10 via-transparent to-status-success/5 pointer-events-none"
                  >
                    <div className="absolute top-6 left-8 px-2 py-1 rounded bg-status-success/20 border border-status-success/40 text-[9px] font-mono text-status-success">
                      LAND COVER: BUILT INDUSTRIAL (10m)
                    </div>
                  </motion.div>
                )}

                {/* Layer 4: Historical Thermal Density Heatmap */}
                {activeLayers.history && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute w-64 h-64 rounded-full bg-brand-amber/15 blur-[60px] pointer-events-none"
                  />
                )}

                {/* Layer 2: Facility Polygon Footprint */}
                {activeLayers.facilities && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-56 h-36 rounded-2xl border-2 border-dashed border-intelligence-cyan/70 bg-intelligence-cyan/10 p-3 flex flex-col justify-between"
                  >
                    <div className="text-[10px] font-mono text-intelligence-cyan font-bold flex items-center justify-between">
                      <span>RELIANCE JAMNAGAR PERIMETER</span>
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[9px] font-mono text-text-muted">
                      OSM POLYGON #10123456 • 1,000m Buffer Active
                    </div>
                  </motion.div>
                )}

                {/* Layer 1: NASA FIRMS Thermal Hotspot Point */}
                {activeLayers.thermal && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-20 flex flex-col items-center"
                  >
                    <div className="relative">
                      <span className="absolute -inset-2 rounded-full bg-brand-orange animate-ping opacity-75" />
                      <div className="relative p-2.5 rounded-full bg-brand-orange text-void shadow-brand-glow">
                        <Flame className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-2 px-2 py-0.5 rounded bg-surface-3/90 border border-brand-orange text-[10px] font-mono font-bold text-text-primary shadow-lg">
                      VIIRS HOTSPOT #26162 (184 MW)
                    </div>
                  </motion.div>
                )}

                {/* Fallback if no layers selected */}
                {!Object.values(activeLayers).some(Boolean) && (
                  <div className="text-center font-mono text-xs text-text-muted space-y-1">
                    <p>All GIS layers currently hidden.</p>
                    <p className="text-[10px]">Toggle layers on the left to inspect spatial fusion.</p>
                  </div>
                )}
              </div>

              {/* Viewport Footer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-3 border-t border-border-subtle z-10">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-intelligence-cyan" />
                  Spatial fusion combines vector polygons with raster topologies in sub-5ms PostGIS queries.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

