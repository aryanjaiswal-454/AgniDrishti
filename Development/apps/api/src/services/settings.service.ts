import { withTransaction, query } from "../db";
import { UpdateSystemSettingsInput } from "../schemas/settings.schema";
import { AlertService } from "./alert.service";
import { emitAlertCreated, emitSystemSettingsUpdated } from "../realtime/socket";

export type BaseMapLayer = "dark" | "satellite" | "osm_tactical";

export interface SystemSettings {
  critical_frp_threshold: number;
  anomaly_z_score_threshold: number;
  default_map_baselayer: BaseMapLayer;
  updated_at: string;
  updated_by: string | null;
}

export interface SettingsRecalculationResult {
  events_reclassified: number;
  alerts_created: number;
  alerts_severity_updated: number;
}

const SETTINGS_SELECT = `
  SELECT critical_frp_threshold, anomaly_z_score_threshold, default_map_baselayer, updated_at, updated_by
  FROM system_settings
  WHERE id = 1`;

function formatSettings(row: any): SystemSettings {
  return {
    critical_frp_threshold: Number(row.critical_frp_threshold),
    anomaly_z_score_threshold: Number(row.anomaly_z_score_threshold),
    default_map_baselayer: row.default_map_baselayer as BaseMapLayer,
    updated_at: row.updated_at,
    updated_by: row.updated_by || null,
  };
}

export class SettingsService {
  static async getSettings(): Promise<SystemSettings> {
    const result = await query(SETTINGS_SELECT);
    return formatSettings(result.rows[0]);
  }

  /**
   * Persist the analyst policy and recalculate existing data atomically.
   * Existing alert lifecycle states are deliberately preserved: a policy
   * change must never silently close an incident owned by an analyst.
   */
  static async updateSettings(
    input: UpdateSystemSettingsInput,
    userId: string
  ): Promise<{ settings: SystemSettings; recalculation: SettingsRecalculationResult }> {
    const result = await withTransaction(async (client) => {
      const settingsResult = await client.query(
        `UPDATE system_settings
         SET critical_frp_threshold = $1,
             anomaly_z_score_threshold = $2,
             default_map_baselayer = $3,
             updated_at = NOW(),
             updated_by = $4
         WHERE id = 1
         RETURNING critical_frp_threshold, anomaly_z_score_threshold, default_map_baselayer, updated_at, updated_by`,
        [
          input.critical_frp_threshold,
          input.anomaly_z_score_threshold,
          input.default_map_baselayer,
          userId,
        ]
      );

      const settings = formatSettings(settingsResult.rows[0]);

      const eventsResult = await client.query(
        `UPDATE classified_events ce
         SET is_anomalous = COALESCE(ce.z_score_frp >= $1, false)
                            OR COALESCE(h.frp, 0) >= $2
         FROM hotspots h
         WHERE h.id = ce.hotspot_id
           AND ce.is_anomalous IS DISTINCT FROM (
             COALESCE(ce.z_score_frp >= $1, false)
             OR COALESCE(h.frp, 0) >= $2
           )`,
        [settings.anomaly_z_score_threshold, settings.critical_frp_threshold]
      );

      const severityResult = await client.query(
        `WITH qualifying AS (
           SELECT ce.id,
             CASE
               WHEN ce.sub_class = 'industrial_fire' OR COALESCE(h.frp, 0) >= $1
                 THEN 'high'::alert_severity
               ELSE 'medium'::alert_severity
             END AS severity
           FROM classified_events ce
           JOIN hotspots h ON h.id = ce.hotspot_id
           WHERE ce.is_anomalous = true
              OR ce.sub_class = 'industrial_fire'
              OR COALESCE(h.frp, 0) >= $1
         )
         UPDATE alerts a
         SET severity = qualifying.severity
         FROM qualifying
         WHERE a.classified_event_id = qualifying.id
           AND a.status IN ('new', 'acknowledged')
           AND a.severity IS DISTINCT FROM qualifying.severity`,
        [settings.critical_frp_threshold]
      );

      const createdAlerts = await client.query<{ id: string }>(
        `WITH qualifying AS (
           SELECT ce.id,
             CASE
               WHEN ce.sub_class = 'industrial_fire' OR COALESCE(h.frp, 0) >= $1
                 THEN 'high'::alert_severity
               ELSE 'medium'::alert_severity
             END AS severity
           FROM classified_events ce
           JOIN hotspots h ON h.id = ce.hotspot_id
           WHERE ce.is_anomalous = true
              OR ce.sub_class = 'industrial_fire'
              OR COALESCE(h.frp, 0) >= $1
         )
         INSERT INTO alerts (classified_event_id, severity, status, sent_at)
         SELECT qualifying.id, qualifying.severity, 'new', NOW()
         FROM qualifying
         WHERE NOT EXISTS (
           SELECT 1
           FROM alerts existing
           WHERE existing.classified_event_id = qualifying.id
             AND existing.status IN ('new', 'acknowledged')
         )
         RETURNING id`,
        [settings.critical_frp_threshold]
      );

      return {
        settings,
        createdAlertIds: createdAlerts.rows.map((row) => row.id),
        recalculation: {
          events_reclassified: eventsResult.rowCount || 0,
          alerts_created: createdAlerts.rowCount || 0,
          alerts_severity_updated: severityResult.rowCount || 0,
        },
      };
    });

    // Announce the policy update after commit so every connected dashboard
    // refetches event, alert, KPI, and map data from one consistent snapshot.
    emitSystemSettingsUpdated(result.settings);

    // Newly created high-priority alerts also get the normal in-app toast.
    for (const alertId of result.createdAlertIds) {
      const alert = await AlertService.getAlertById(alertId);
      emitAlertCreated({
        id: alert.id,
        classified_event_id: alert.classified_event_id,
        severity: alert.severity,
        status: alert.status,
        sent_at: alert.sent_at,
        acknowledged_by: alert.acknowledged_by,
        event: alert.event,
      });
    }

    return { settings: result.settings, recalculation: result.recalculation };
  }
}
