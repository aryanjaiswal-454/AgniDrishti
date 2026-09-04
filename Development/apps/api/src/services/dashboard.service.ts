import { query } from "../db";
import { SettingsService } from "./settings.service";

export interface DashboardSummary {
  metrics: {
    total_hotspots: number;
    total_classified_events: number;
    industrial_fires_count: number;
    persistent_sources_count: number;
    natural_fires_count: number;
    anomalous_events_count: number;
    active_alerts_count: number;
    high_severity_alerts_count: number;
  };
  breakdown_by_class: Array<{
    sub_class: string;
    count: number;
  }>;
  recent_events: Array<{
    id: string;
    primary_class: string;
    sub_class: string;
    facility_name: string | null;
    latitude: number;
    longitude: number;
    frp: number | null;
    confidence_score: number;
    is_anomalous: boolean;
    created_at: string;
  }>;
  pipeline_metadata: {
    version: string;
    strategy: string;
    anomaly_threshold: string;
  };
}

export class DashboardService {
  /**
   * Get aggregated command center metrics and statistics.
   */
  static async getSummary(): Promise<DashboardSummary> {
    const settings = await SettingsService.getSettings();
    // 1. Overall counts
    const metricsRes = await query<{
      total_hotspots: string;
      total_classified_events: string;
      industrial_fires_count: string;
      persistent_sources_count: string;
      natural_fires_count: string;
      anomalous_events_count: string;
    }>(
      `SELECT
        (SELECT COUNT(*)::text FROM hotspots) as total_hotspots,
        (SELECT COUNT(*)::text FROM classified_events) as total_classified_events,
        (SELECT COUNT(*)::text FROM classified_events WHERE sub_class = 'industrial_fire') as industrial_fires_count,
        (SELECT COUNT(*)::text FROM classified_events WHERE sub_class = 'gas_flare') as persistent_sources_count,
        (SELECT COUNT(*)::text FROM classified_events WHERE primary_class = 'natural') as natural_fires_count,
        (SELECT COUNT(*)::text FROM classified_events WHERE is_anomalous = true) as anomalous_events_count;`
    );

    // 2. Alert counts
    const alertRes = await query<{
      active_alerts: string;
      high_severity_alerts: string;
    }>(
      `SELECT
        COUNT(CASE WHEN a.status IN ('new', 'acknowledged')
                         AND (ce.is_anomalous = true OR ce.sub_class = 'industrial_fire')
                   THEN 1 END)::text as active_alerts,
        COUNT(CASE WHEN a.status = 'new' AND a.severity = 'high'
                         AND (ce.is_anomalous = true OR ce.sub_class = 'industrial_fire')
                   THEN 1 END)::text as high_severity_alerts
       FROM alerts a
       JOIN classified_events ce ON ce.id = a.classified_event_id;`
    );

    // 3. Breakdown by sub_class
    const breakdownRes = await query<{ sub_class: string; count: string }>(
      `SELECT sub_class, COUNT(*)::text as count
       FROM classified_events
       GROUP BY sub_class
       ORDER BY count DESC;`
    );

    // 4. Recent classified events
    const recentRes = await query<any>(
      `SELECT
        ce.id,
        ce.primary_class,
        ce.sub_class,
        ce.confidence_score,
        ce.is_anomalous,
        ce.created_at,
        f.name as facility_name,
        h.latitude,
        h.longitude,
        h.frp
       FROM classified_events ce
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       ORDER BY ce.created_at DESC
       LIMIT 6;`
    );

    const m = metricsRes.rows[0] || {
      total_hotspots: "0",
      total_classified_events: "0",
      industrial_fires_count: "0",
      persistent_sources_count: "0",
      natural_fires_count: "0",
      anomalous_events_count: "0",
    };

    const a = alertRes.rows[0] || {
      active_alerts: "0",
      high_severity_alerts: "0",
    };

    return {
      metrics: {
        total_hotspots: parseInt(m.total_hotspots, 10),
        total_classified_events: parseInt(m.total_classified_events, 10),
        industrial_fires_count: parseInt(m.industrial_fires_count, 10),
        persistent_sources_count: parseInt(m.persistent_sources_count, 10),
        natural_fires_count: parseInt(m.natural_fires_count, 10),
        anomalous_events_count: parseInt(m.anomalous_events_count, 10),
        active_alerts_count: parseInt(a.active_alerts, 10),
        high_severity_alerts_count: parseInt(a.high_severity_alerts, 10),
      },
      breakdown_by_class: breakdownRes.rows.map((r) => ({
        sub_class: r.sub_class,
        count: parseInt(r.count, 10),
      })),
      recent_events: recentRes.rows.map((row) => ({
        id: row.id,
        primary_class: row.primary_class,
        sub_class: row.sub_class,
        facility_name: row.facility_name,
        latitude: row.latitude,
        longitude: row.longitude,
        frp: row.frp ? parseFloat(row.frp) : null,
        confidence_score: parseFloat(row.confidence_score),
        is_anomalous: row.is_anomalous,
        created_at: row.created_at,
      })),
      pipeline_metadata: {
        version: process.env.CLASSIFIER_VERSION || "v1.1.0-live-dynamic", // Upgraded version
        strategy: process.env.CLASSIFIER_STRATEGY || "Rules + PostGIS Spatial (Dynamic)", // Stating dynamic PostGIS spatial
        anomaly_threshold: `+${settings.anomaly_z_score_threshold.toFixed(1)}σ FRP Exceedance (Rolling 90d)`
      }
    };
  }
}

