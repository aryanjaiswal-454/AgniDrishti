import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapSelection, ClusterData } from "../types";
import { Button, Badge, ConfidenceIndicator } from "../../ui";
import { EventClassBadge, AnomalyBadge } from "../../../pages/events/EventClassBadge";
import { FacilityInvestigationPanel } from "./FacilityInvestigationPanel";
import { IntelligencePipelineTrace } from "./IntelligencePipelineTrace";
import { useAlerts } from "../../../hooks/useAlerts";
import { AlertSeverityBadge, AlertLifecycleBadge } from "../../../pages/alerts/AlertSeverityBadge";
import {
  X,
  Flame,
  Building2,
  Layers,
  ExternalLink,
  ZoomIn,
  MapPin,
  Thermometer,
  Crosshair,
  Calendar,
  Satellite,
  Tag,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Radio,
} from "lucide-react";

export interface MapInvestigationDrawerProps {
  selection: MapSelection;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onZoomCluster?: (bounds: [[number, number], [number, number]]) => void;
}

/** Reusable section header inside the drawer */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  label: string;
  className?: string;
}> = ({ icon, label, className = "" }) => (
  <div
    className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border-subtle pb-1.5 ${className}`}
  >
    {icon}
    <span>{label}</span>
  </div>
);

/** Compact row for key-value inside a section */
const InfoRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="flex items-center justify-between text-[11px]">
    <span className="text-text-muted">{label}</span>
    {children}
  </div>
);

export const MapInvestigationDrawer: React.FC<MapInvestigationDrawerProps> = ({
  selection,
  onClose,
  onNavigate,
  onZoomCluster,
}) => {
  // Query alerts for alert linkage (cached from existing queries in most cases)
  const { data: alertsRes } = useAlerts({ limit: 20 }, { enabled: selection?.type === "event" });

  // Find linked alert for the selected event
  const linkedAlert = useMemo(() => {
    if (selection?.type !== "event" || !alertsRes?.data) return null;
    return (
      alertsRes.data.find(
        (a) => a.classified_event_id === selection.data.id
      ) || null
    );
  }, [selection, alertsRes]);

  if (!selection) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`map-investigation-${selection.type}-${selection.data.id}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-3 right-3 bottom-3 z-[1001] w-full max-w-sm sm:w-96 md:w-[420px] rounded-xl bg-surface/95 backdrop-blur-xl border border-border-normal shadow-2xl overflow-y-auto flex flex-col justify-between p-4 sm:p-5 font-mono text-xs text-text-primary"
        role="dialog"
        aria-label="Investigation Drawer"
      >
        {/* Top Header Strip */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            {selection.type === "event" && <Flame className="w-4 h-4 text-brand-orange" />}
            {selection.type === "facility" && <Building2 className="w-4 h-4 text-intelligence-cyan" />}
            {selection.type === "cluster" && <Layers className="w-4 h-4 text-brand-orange" />}
            <span className="font-bold uppercase tracking-wider text-[11px] text-text-secondary">
              {selection.type === "event"
                ? "Thermal Investigation"
                : selection.type === "facility"
                ? "Facility Intelligence"
                : "Event Cluster"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close investigation drawer"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 flex-1">
          {/* ============================================ */}
          {/* 1. THERMAL EVENT INVESTIGATION */}
          {/* ============================================ */}
          {selection.type === "event" && (
            <>
              {/* Event ID + Anomaly Badge */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">
                  EVT-{selection.data.id.substring(0, 8).toUpperCase()}
                </span>
                <AnomalyBadge isAnomalous={selection.data.is_anomalous} size="sm" />
              </div>

              {/* ─── THERMAL SIGNAL ─── */}
              <div className="space-y-2">
                <SectionHeader
                  icon={<Thermometer className="w-3.5 h-3.5 text-brand-orange" />}
                  label="Thermal Signal"
                />
                <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border-subtle space-y-1.5">
                  <InfoRow label="Fire Radiative Power:">
                    <span className="text-brand-orange font-bold">
                      {selection.data.frp !== null ? `${selection.data.frp} MW` : "N/A"}
                    </span>
                  </InfoRow>

                  {selection.data.brightness !== null && (
                    <InfoRow label="Brightness Temp (TI4):">
                      <span className="text-text-primary">{selection.data.brightness} K</span>
                    </InfoRow>
                  )}

                  <InfoRow label="Coordinates:">
                    <span className="text-text-primary font-mono">
                      {selection.data.lat.toFixed(4)}°, {selection.data.lon.toFixed(4)}°
                    </span>
                  </InfoRow>

                  <InfoRow label="Detection Date:">
                    <span className="text-text-primary">{selection.data.acquisition_date}</span>
                  </InfoRow>
                </div>
              </div>

              {/* ─── CLASSIFICATION ─── */}
              <div className="space-y-2">
                <SectionHeader
                  icon={<Tag className="w-3.5 h-3.5 text-brand-amber" />}
                  label="Classification"
                />
                <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border-subtle space-y-1.5">
                  <InfoRow label="Primary / Sub-Class:">
                    <EventClassBadge
                      primaryClass={selection.data.primary_class}
                      subClass={selection.data.sub_class}
                      size="sm"
                    />
                  </InfoRow>

                  <InfoRow label="Confidence:">
                    <ConfidenceIndicator score={selection.data.confidence_score} size="sm" />
                  </InfoRow>
                </div>
              </div>

              {/* ─── SPATIAL CONTEXT ─── */}
              {selection.data.facility_name && (
                <div className="space-y-2">
                  <SectionHeader
                    icon={<Building2 className="w-3.5 h-3.5 text-intelligence-cyan" />}
                    label="Nearest Facility"
                  />
                  <div className="p-2.5 rounded-lg bg-intelligence-cyan/5 border border-intelligence-cyan/20 space-y-1.5">
                    <div className="text-text-primary font-semibold text-xs truncate">
                      {selection.data.facility_name}
                    </div>
                    {selection.data.distance_to_facility_m !== null && (
                      <InfoRow label="Distance:">
                        <span className="text-intelligence-cyan font-bold">
                          ~{Math.round(selection.data.distance_to_facility_m)} m
                        </span>
                      </InfoRow>
                    )}
                  </div>
                </div>
              )}

              {/* ─── HISTORICAL CONTEXT ─── */}
              <div className="space-y-2">
                <SectionHeader
                  icon={<Activity className="w-3.5 h-3.5 text-status-success" />}
                  label="Historical Context"
                />
                <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border-subtle space-y-1.5">
                  <InfoRow label="Anomaly Status:">
                    <span
                      className={`font-bold ${
                        selection.data.is_anomalous
                          ? "text-status-critical"
                          : "text-status-success"
                      }`}
                    >
                      {selection.data.is_anomalous ? "ANOMALOUS (+3σ)" : "NOMINAL"}
                    </span>
                  </InfoRow>
                </div>
              </div>

              {/* ─── ALERT LINKED ─── */}
              {linkedAlert && (
                <div className="space-y-2">
                  <SectionHeader
                    icon={<Radio className="w-3.5 h-3.5 text-status-critical" />}
                    label="Alert Linked"
                  />
                  <div
                    className={`p-2.5 rounded-lg border space-y-1.5 ${
                      linkedAlert.severity === "high"
                        ? "bg-status-critical/5 border-status-critical/25"
                        : "bg-surface-2/80 border-border-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">
                        ALT-{linkedAlert.id.substring(0, 6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <AlertSeverityBadge severity={linkedAlert.severity} size="sm" />
                        <AlertLifecycleBadge status={linkedAlert.status} size="sm" />
                      </div>
                    </div>
                    <InfoRow label="Sent at:">
                      <span className="text-text-primary text-[10px]">
                        {new Date(linkedAlert.sent_at).toLocaleString()}
                      </span>
                    </InfoRow>
                  </div>
                </div>
              )}

              {/* ─── INTELLIGENCE TRACE ─── */}
              <div className="pt-1">
                <IntelligencePipelineTrace
                  marker={selection.data}
                  linkedAlert={linkedAlert}
                />
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* 2. FACILITY INVESTIGATION & TIMESERIES */}
          {/* ============================================ */}
          {selection.type === "facility" && (
            <FacilityInvestigationPanel
              key={`facility-panel-${selection.data.id}`}
              facilityMarker={selection.data}
              onNavigate={onNavigate}
            />
          )}

          {/* ============================================ */}
          {/* 3. CLUSTER INVESTIGATION */}
          {/* ============================================ */}
          {selection.type === "cluster" && (
            <>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-text-primary">
                  Thermal Cluster ({selection.data.eventCount} Hotspots)
                </h3>
                <span className="text-text-muted text-[11px]">
                  Aggregated spatial thermal events in dense sector
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-2/80 border border-border-subtle space-y-2 text-[11px]">
                <InfoRow label="Total Hotspots:">
                  <span className="text-brand-orange font-bold">{selection.data.eventCount}</span>
                </InfoRow>

                <InfoRow label="Anomalous Exceedances:">
                  <span
                    className={
                      selection.data.anomalousCount > 0
                        ? "text-status-critical font-bold"
                        : "text-text-muted"
                    }
                  >
                    {selection.data.anomalousCount}
                  </span>
                </InfoRow>

                <InfoRow label="Cluster Centroid:">
                  <span className="text-text-muted font-mono">
                    {selection.data.lat.toFixed(4)}°, {selection.data.lon.toFixed(4)}°
                  </span>
                </InfoRow>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border-subtle space-y-2">
          {selection.type === "event" && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => onNavigate(`/events/${selection.data.id}`)}
              >
                View Event Investigation
              </Button>
              {selection.data.facility_id && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  rightIcon={<Building2 className="w-3.5 h-3.5" />}
                  onClick={() => onNavigate(`/facilities/${selection.data.facility_id}`)}
                >
                  View Nearest Facility
                </Button>
              )}
              {linkedAlert && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[11px]"
                  rightIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                  onClick={() => onNavigate("/alerts")}
                >
                  View Alert Triage
                </Button>
              )}
            </>
          )}

          {selection.type === "facility" && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => onNavigate(`/facilities/${selection.data.id}`)}
            >
              View Facility Intelligence
            </Button>
          )}

          {selection.type === "cluster" && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              rightIcon={<ZoomIn className="w-3.5 h-3.5" />}
              onClick={() => {
                if (onZoomCluster) {
                  onZoomCluster(selection.data.bounds);
                }
              }}
            >
              Zoom Into Cluster
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

