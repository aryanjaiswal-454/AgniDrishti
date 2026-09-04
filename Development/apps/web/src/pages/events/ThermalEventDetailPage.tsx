import React, { useState } from "react";
import {
  ArrowLeft,
  Flame,
  Radio,
  Building2,
  AlertTriangle,
  Database,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { PageContainer, PageHeader } from "../../components/shell";
import {
  Card,
  Badge,
  Button,
  Select,
  Skeleton,
  ErrorState,
  ConfidenceIndicator,
} from "../../components/ui";
import { useEvent, useSubmitFeedback } from "../../hooks/useEvents";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { EventClassBadge, AnomalyBadge } from "./EventClassBadge";
import { formatDistanceMeters, formatZScore } from "../../utils/formatters";

export interface ThermalEventDetailPageProps {
  eventId: string;
  onNavigate: (route: string) => void;
}

const CORRECTION_LABELS = [
  { value: "gas_flare", label: "Routine Gas Flare Stack" },
  { value: "industrial_fire", label: "Industrial Fire (Hazard Incident)" },
  { value: "mining_activity", label: "Mining / Slag Thermal Source" },
  { value: "forest_fire", label: "Forest Wildfire" },
  { value: "agricultural_burning", label: "Agricultural Stubble Burning" },
  { value: "other_natural", label: "Other Natural Thermal Bloom" },
  { value: "unclassified", label: "Unclassified / Uncertain" },
];

export const ThermalEventDetailPage: React.FC<ThermalEventDetailPageProps> = ({
  eventId,
  onNavigate,
}) => {
  const { user } = useCurrentUser();
  const { data: eventRes, isLoading, error, refetch, isFetching } = useEvent(eventId);
  const submitFeedbackMutation = useSubmitFeedback();

  const [correctedLabel, setCorrectedLabel] = useState<string>("gas_flare");
  const [feedbackNotes, setFeedbackNotes] = useState<string>("");
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const event = eventRes?.data;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(false);

    try {
      await submitFeedbackMutation.mutateAsync({
        eventId,
        data: {
          corrected_label: correctedLabel,
          notes: feedbackNotes.trim() || undefined,
        },
      });
      setFeedbackSuccess(true);
      setFeedbackNotes("");
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to record ground-truth analyst feedback.");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-28 h-8 rounded-lg" />
            <Skeleton className="w-48 h-8 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !event) {
    return (
      <PageContainer>
        <div className="pt-8">
          <ErrorState
            title="CLASSIFIED EVENT NOT FOUND"
            message={
              error?.message ||
              "The requested thermal event record could not be retrieved from the intelligence database."
            }
            onRetry={() => refetch()}
          />
          <div className="mt-4 text-center">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onNavigate("/events")}
            >
              Back to Thermal Events Registry
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const hotspot = event.hotspot;
  const facility = event.facility;
  const isAnalystOrAdmin = user?.role === "admin" || user?.role === "analyst";

  const coordinates = hotspot
    ? `${hotspot.latitude.toFixed(4)}° N, ${hotspot.longitude.toFixed(4)}° E`
    : "Coordinates not recorded";

  return (
    <PageContainer>
      {/* Top Header & Breadcrumbs */}
      <PageHeader
        title={`THERMAL EVENT EVT-${event.id.substring(0, 8).toUpperCase()}`}
        subtitle={`Classified by AgniDrishti Inference Engine • Acquired ${hotspot?.acq_date || new Date(event.created_at).toLocaleDateString()}`}
        badge={
          <div className="flex items-center gap-2">
            <EventClassBadge primaryClass={event.primary_class} subClass={event.sub_class} size="md" />
            <AnomalyBadge isAnomalous={event.is_anomalous} size="md" />
          </div>
        }
        breadcrumbs={[
          { label: "AgniDrishti", href: "/command-center" },
          { label: "Thermal Events", href: "/events" },
          { label: `EVT-${event.id.substring(0, 8).toUpperCase()}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onNavigate("/events")}
            >
              Back to Events
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Key Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Radiative Power (FRP)
            </div>
            <div className="text-2xl font-mono font-bold text-brand-orange">
              {hotspot?.frp ? `${hotspot.frp} MW` : "Not available"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              {hotspot?.bright_ti4 ? `Brightness Temp: ${hotspot.bright_ti4} K` : "Sensor telemetry"}
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Confidence Score
            </div>
            <div className="text-2xl font-mono font-bold text-intelligence-cyan">
              {Math.round(event.confidence_score * 100)}%
            </div>
            <div className="pt-1">
              <ConfidenceIndicator score={event.confidence_score} size="sm" />
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              FRP Baseline Z-Score
            </div>
            <div className={`text-2xl font-mono font-bold ${event.is_anomalous ? "text-status-critical" : "text-text-primary"}`}>
              {event.z_score_frp !== null && event.z_score_frp !== undefined
                ? formatZScore(event.z_score_frp)
                : event.facility_id
                  ? "Insufficient history"
                  : "No nearby facility"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              {event.z_score_frp !== null && event.z_score_frp !== undefined
                ? event.z_score_frp > 3.0
                  ? "Exceeded 3σ threshold"
                  : "Within expected baseline"
                : event.facility_id
                  ? "Awaiting sufficient FRP history"
                  : "Facility baseline applies within 5 km"}
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              90-Day Recurrence Count
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {event.recurrence_count_90d !== null && event.recurrence_count_90d !== undefined
                ? `${event.recurrence_count_90d} passes`
                : "0"}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              {event.recurrence_count_90d && event.recurrence_count_90d > 5
                ? "Persistent emission source"
                : "Sporadic or new thermal ignition"}
            </div>
          </Card>
        </div>

        {/* 2-Column Investigation Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: AI Classification & Raw Telemetry */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: AI Classification & Evidence */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-intelligence-cyan" />
                  <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                    AI Classification & Model Inference
                  </h4>
                </div>
                <Badge variant="cyan" size="sm">
                  {event.model_version || "v1.0.0"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-surface-2 border border-border-subtle space-y-1.5">
                  <div className="text-text-muted text-[10px] uppercase">Primary Segregation</div>
                  <div className="text-text-primary font-semibold text-sm">
                    {event.primary_class ? event.primary_class.toUpperCase() : "UNCLASSIFIED"}
                  </div>
                  <div className="text-text-muted text-[11px]">
                    Land cover: {event.land_cover_type || "satellite raster analysis"}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-2 border border-border-subtle space-y-1.5">
                  <div className="text-text-muted text-[10px] uppercase">Granular Sub-Class</div>
                  <div className="text-text-primary font-semibold text-sm">
                    {event.sub_class ? event.sub_class.replace("_", " ").toUpperCase() : "UNCLASSIFIED"}
                  </div>
                  <div className="text-text-muted text-[11px]">
                    Inference confidence: {Math.round(event.confidence_score * 100)}%
                  </div>
                </div>
              </div>

              {/* Structured Evidence / Model Explanation Area */}
              <div className="p-4 rounded-lg bg-surface-2/60 border border-border-subtle space-y-2">
                <div className="text-[11px] font-mono font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-amber" />
                  Classification Evidence & Rationalization
                </div>
                <p className="text-xs font-mono text-text-muted leading-relaxed">
                  Detailed model explanation will appear when the classifier provides it.
                </p>
              </div>
            </Card>

            {/* Section 2: Raw Satellite Signal (NASA FIRMS) */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Radio className="w-4 h-4 text-brand-orange" />
                <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Raw Satellite Thermal Telemetry (NASA FIRMS)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Acquisition Time</span>
                  <span className="text-text-primary font-semibold">
                    {hotspot?.acq_date || "N/A"} {hotspot?.acq_time ? `• ${hotspot.acq_time} UTC` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Satellite & Instrument</span>
                  <span className="text-text-primary font-semibold">
                    {hotspot?.instrument || "VIIRS"} ({hotspot?.satellite || "NRT"})
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Orbit Pass</span>
                  <span className="text-text-primary font-semibold">
                    {hotspot?.daynight === "D" ? "Daytime Pass" : "Nighttime Pass"}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Raw Sensor Confidence</span>
                  <span className="text-text-primary font-semibold uppercase">
                    {hotspot?.confidence || "Nominal"}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Coordinates</span>
                  <span className="text-text-primary font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-amber shrink-0" />
                    <span>{coordinates}</span>
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Ingestion Source</span>
                  <span className="text-text-primary font-semibold">NASA FIRMS NRT Stream</span>
                </div>
              </div>
            </Card>

            {/* Section 3: Analyst Verification & Ground-Truth Loop */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-amber" />
                  <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                    Analyst Ground-Truth Verification & Feedback
                  </h4>
                </div>
                <Badge variant={isAnalystOrAdmin ? "warning" : "default"} size="sm">
                  {isAnalystOrAdmin ? "Analyst Actions Enabled" : "Read-Only Observer"}
                </Badge>
              </div>

              {isAnalystOrAdmin ? (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  {feedbackSuccess && (
                    <div className="p-3 rounded-lg bg-status-success/15 border border-status-success/30 flex items-center gap-2 text-status-success text-xs font-mono">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Ground-truth correction recorded successfully. Retraining queue updated.</span>
                    </div>
                  )}

                  {feedbackError && (
                    <div className="p-3 rounded-lg bg-status-critical/15 border border-status-critical/30 flex items-center gap-2 text-status-critical text-xs font-mono">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{feedbackError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-text-muted uppercase block">
                        Corrected Classification Label
                      </label>
                      <Select
                        options={CORRECTION_LABELS}
                        value={correctedLabel}
                        onChange={(e) => setCorrectedLabel(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-text-muted uppercase block">
                        Analyst Observation Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Visual confirmation of routine flare stack maintenance."
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        className="w-full h-9 rounded-md bg-surface-2 border border-border-normal px-3 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={submitFeedbackMutation.isPending}
                      leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Submit Verification & Retrain
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-lg bg-surface-2 border border-border-subtle text-xs font-mono text-text-muted">
                  Analyst feedback and model ground-truth corrections are restricted to Analyst and Admin roles.
                </div>
              )}

              {/* Feedback History Log */}
              {event.feedback_history && event.feedback_history.length > 0 && (
                <div className="pt-3 border-t border-border-subtle space-y-2">
                  <div className="text-[10px] font-mono uppercase text-text-muted">
                    Previous Ground-Truth Submissions ({event.feedback_history.length})
                  </div>
                  <div className="space-y-2">
                    {event.feedback_history.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3 rounded bg-surface-2/80 border border-border-subtle text-xs font-mono flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-text-primary">
                            Label: {fb.corrected_label}
                          </div>
                          {fb.notes && <div className="text-text-muted text-[11px]">&quot;{fb.notes}&quot;</div>}
                        </div>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right 4 Cols: Facility Context & Event Metadata */}
          <div className="lg:col-span-4 space-y-6">
            {/* Facility Context Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Building2 className="w-4 h-4 text-brand-amber" />
                <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Spatial Infrastructure Context
                </h4>
              </div>

              {facility ? (
                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <span className="text-text-muted text-[10px] uppercase block">Linked Facility</span>
                    <span className="text-text-primary font-bold text-sm block mt-0.5">
                      {facility.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Asset Type:</span>
                    <Badge variant="brand" size="sm">
                      {facility.facility_type.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Distance to Center:</span>
                    <span className="text-text-primary font-semibold">
                      {event.distance_to_facility_m !== null && event.distance_to_facility_m !== undefined
                        ? formatDistanceMeters(event.distance_to_facility_m)
                        : "Within 1,000m buffer"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Administrative Region:</span>
                    <span className="text-text-primary">
                      {facility.state || "National"}{facility.district ? `, ${facility.district}` : ""}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      onClick={() => onNavigate(`/facilities/${facility.id}`)}
                    >
                      View Facility Intelligence
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono text-text-muted space-y-2">
                  <p>
                    No industrial facility is within the 5 km association range of this thermal signal.
                  </p>
                  {event.nearest_facility && (
                    <div className="p-2.5 rounded bg-surface-2 text-[11px] text-text-secondary">
                      Nearest monitored facility: <span className="font-semibold text-text-primary">{event.nearest_facility.name || "Unnamed facility"}</span>
                      {" "}({formatDistanceMeters(event.nearest_facility.distance_m)} away).
                    </div>
                  )}
                  <div className="p-2.5 rounded bg-surface-2 text-[11px]">
                    Classified as natural/agricultural thermal occurrence based on land cover analysis and distance thresholds.
                  </div>
                </div>
              )}
            </Card>

            {/* Provenance & Audit Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Database className="w-4 h-4 text-intelligence-cyan" />
                <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Provenance & Technical Record
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Classified Event UUID</span>
                  <span className="text-text-secondary text-[11px] break-all block mt-0.5">
                    {event.id}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase block">Linked Hotspot ID</span>
                  <span className="text-text-secondary text-[11px] break-all block mt-0.5">
                    {event.hotspot_id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Model Pipeline:</span>
                  <span className="text-text-primary text-[11px]">{event.model_version}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Recorded Timestamp:</span>
                  <span className="text-text-secondary text-[11px]">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

