import { FirmsIngestionResult } from "./firms/service";
import { OsmSyncResult } from "./osm/service";

export interface PipelineTelemetry {
  firms: {
    status: "idle" | "running" | "healthy" | "degraded" | "error";
    last_sync_at: string | null;
    latest_run_stats?: {
      source: string;
      records_fetched: number;
      records_accepted: number;
      records_inserted: number;
      duplicates_skipped: number;
      invalid_count: number;
      duration_ms: number;
    } | null;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    latest_error?: string | null;
  };
  osm: {
    status: "idle" | "running" | "healthy" | "degraded" | "error";
    last_sync_at: string | null;
    latest_run_stats?: {
      features_fetched: number;
      facilities_upserted: number;
      invalid_features: number;
      duration_ms: number;
    } | null;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    latest_error?: string | null;
  };
  server_time: string;
}

class IngestionTelemetryTracker {
  private telemetry: PipelineTelemetry = {
    firms: {
      status: "idle",
      last_sync_at: null,
      latest_run_stats: null,
      total_runs: 0,
      successful_runs: 0,
      failed_runs: 0,
      latest_error: null,
    },
    osm: {
      status: "idle",
      last_sync_at: null,
      latest_run_stats: null,
      total_runs: 0,
      successful_runs: 0,
      failed_runs: 0,
      latest_error: null,
    },
    server_time: new Date().toISOString(),
  };

  recordFirmsRun(result: FirmsIngestionResult) {
    this.telemetry.firms.status = "healthy";
    this.telemetry.firms.last_sync_at = new Date().toISOString();
    this.telemetry.firms.latest_run_stats = { ...result };
    this.telemetry.firms.total_runs++;
    this.telemetry.firms.successful_runs++;
    this.telemetry.firms.latest_error = null;
  }

  recordFirmsError(error: string, _duration_ms: number) {
    this.telemetry.firms.status = "error";
    this.telemetry.firms.total_runs++;
    this.telemetry.firms.failed_runs++;
    this.telemetry.firms.latest_error = error;
  }

  recordOsmRun(result: OsmSyncResult) {
    this.telemetry.osm.status = "healthy";
    this.telemetry.osm.last_sync_at = new Date().toISOString();
    this.telemetry.osm.latest_run_stats = { ...result };
    this.telemetry.osm.total_runs++;
    this.telemetry.osm.successful_runs++;
    this.telemetry.osm.latest_error = null;
  }

  recordOsmError(error: string, _duration_ms: number) {
    this.telemetry.osm.status = "error";
    this.telemetry.osm.total_runs++;
    this.telemetry.osm.failed_runs++;
    this.telemetry.osm.latest_error = error;
  }

  getStatus(): PipelineTelemetry {
    return {
      ...this.telemetry,
      server_time: new Date().toISOString(),
    };
  }
}

export const telemetryTracker = new IngestionTelemetryTracker();
export default telemetryTracker;

