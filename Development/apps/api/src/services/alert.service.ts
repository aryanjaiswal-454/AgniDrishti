import { query } from "../db";
import { AlertQueryInput, UpdateAlertStatusInput } from "../schemas/alert.schema";
import { Alert, AlertSeverity, AlertStatus, ClassifiedEvent } from "@agnidrishti/shared-types";
import { ConflictError, NotFoundError } from "../utils/errors";
import { emitAlertCreated } from "../realtime/socket";
import { AlertCreatedPayload } from "../realtime/events";
import logger from "../utils/logger";

export interface AlertWithDetails extends Alert {
  event?: Partial<ClassifiedEvent> & {
    facility_name?: string;
    latitude?: number;
    longitude?: number;
    frp?: number;
  };
  acknowledged_by_name?: string;
}

export interface CreateAlertInput {
  id?: string;
  classified_event_id: string;
  severity: AlertSeverity;
  status?: AlertStatus;
}

export class AlertService {
  /**
   * List real-time alerts with severity/status filters and linked event details.
   */
  static async getAlerts(filters: AlertQueryInput): Promise<{ alerts: AlertWithDetails[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.severity) {
      conditions.push(`a.severity = $${idx++}`);
      values.push(filters.severity);
    }

    if (filters.status) {
      conditions.push(`a.status = $${idx++}`);
      values.push(filters.status);
    }

    if (filters.active_only) {
      // "Active" is an operational view, not just a stored workflow state.
      // Keep historical alerts and their analyst decisions intact, but surface
      // only open alerts whose linked event still meets the current policy.
      // `is_anomalous` is recalculated from the global FRP/Z-score policy;
      // industrial fires always remain actionable.
      conditions.push(`a.status IN ('new', 'acknowledged')
        AND EXISTS (
          SELECT 1
          FROM classified_events active_ce
          WHERE active_ce.id = a.classified_event_id
            AND (active_ce.is_anomalous = true OR active_ce.sub_class = 'industrial_fire')
        )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM alerts a ${whereClause};`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    // Results
    const limit = filters.limit;
    const offset = filters.offset;
    values.push(limit, offset);

    const alertsRes = await query<any>(
      `SELECT
        a.id,
        a.classified_event_id,
        a.severity,
        a.status,
        a.sent_at,
        a.acknowledged_by,
        u.name as acknowledged_by_name,
        ce.primary_class,
        ce.sub_class,
        ce.confidence_score,
        ce.is_anomalous,
        f.name as facility_name,
        h.latitude,
        h.longitude,
        h.frp
       FROM alerts a
       JOIN classified_events ce ON a.classified_event_id = ce.id
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       LEFT JOIN users u ON a.acknowledged_by = u.id
       ${whereClause}
       ORDER BY
        CASE a.severity
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END ASC,
        a.sent_at DESC
       LIMIT $${idx++} OFFSET $${idx++};`,
      values
    );

    const formattedAlerts: AlertWithDetails[] = alertsRes.rows.map((row) => ({
      id: row.id,
      classified_event_id: row.classified_event_id,
      severity: row.severity,
      status: row.status,
      sent_at: row.sent_at,
      acknowledged_by: row.acknowledged_by,
      acknowledged_by_name: row.acknowledged_by_name || undefined,
      event: {
        id: row.classified_event_id,
        primary_class: row.primary_class,
        sub_class: row.sub_class,
        confidence_score: parseFloat(row.confidence_score),
        is_anomalous: row.is_anomalous,
        facility_name: row.facility_name,
        latitude: row.latitude,
        longitude: row.longitude,
        frp: row.frp ? parseFloat(row.frp) : undefined,
      },
    }));

    return {
      alerts: formattedAlerts,
      total,
    };
  }

  /**
   * Fetch a single alert by ID with event join.
   */
  static async getAlertById(id: string): Promise<AlertWithDetails> {
    const res = await query<any>(
      `SELECT
        a.id,
        a.classified_event_id,
        a.severity,
        a.status,
        a.sent_at,
        a.acknowledged_by,
        u.name as acknowledged_by_name,
        ce.primary_class,
        ce.sub_class,
        ce.confidence_score,
        ce.is_anomalous,
        f.name as facility_name,
        h.latitude,
        h.longitude,
        h.frp
       FROM alerts a
       JOIN classified_events ce ON a.classified_event_id = ce.id
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       LEFT JOIN users u ON a.acknowledged_by = u.id
       WHERE a.id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Alert with ID ${id} not found`);
    }

    const row = res.rows[0];
    return {
      id: row.id,
      classified_event_id: row.classified_event_id,
      severity: row.severity,
      status: row.status,
      sent_at: row.sent_at,
      acknowledged_by: row.acknowledged_by,
      acknowledged_by_name: row.acknowledged_by_name || undefined,
      event: {
        id: row.classified_event_id,
        primary_class: row.primary_class,
        sub_class: row.sub_class,
        confidence_score: parseFloat(row.confidence_score),
        is_anomalous: row.is_anomalous,
        facility_name: row.facility_name,
        latitude: row.latitude,
        longitude: row.longitude,
        frp: row.frp ? parseFloat(row.frp) : undefined,
      },
    };
  }

  /**
   * Create a new alert in DB and emit a Socket.io real-time broadcast.
   *
   * Flow:
   * 1. DB persistence succeeds
   * 2. Fetch event context
   * 3. Socket.io broadcast
   */
  static async createAlert(input: CreateAlertInput): Promise<AlertWithDetails> {
    const status = input.status || "new";

    let insertRes;
    if (input.id) {
      insertRes = await query<Alert>(
        `INSERT INTO alerts (id, classified_event_id, severity, status, sent_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET severity = EXCLUDED.severity
         RETURNING id, classified_event_id, severity, status, sent_at, acknowledged_by;`,
        [input.id, input.classified_event_id, input.severity, status]
      );
    } else {
      insertRes = await query<Alert>(
        `INSERT INTO alerts (classified_event_id, severity, status, sent_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, classified_event_id, severity, status, sent_at, acknowledged_by;`,
        [input.classified_event_id, input.severity, status]
      );
    }

    const createdAlert = insertRes.rows[0];

    // Fetch full alert details with joined event context
    const fullAlert = await AlertService.getAlertById(createdAlert.id);

    const payload: AlertCreatedPayload = {
      id: fullAlert.id,
      classified_event_id: fullAlert.classified_event_id,
      severity: fullAlert.severity,
      status: fullAlert.status,
      sent_at: fullAlert.sent_at,
      acknowledged_by: fullAlert.acknowledged_by,
      event: fullAlert.event,
    };

    try {
      emitAlertCreated(payload);
    } catch (err: any) {
      logger.error(`[AlertService] Failed to broadcast alert ${fullAlert.id} via Socket.io: ${err.message}`);
    }

    return fullAlert;
  }

  /**
   * Update alert status (acknowledge/resolve/false_positive) by authorized analyst/admin.
   */
  static async updateAlertStatus(
    id: string,
    input: UpdateAlertStatusInput,
    userId: string
  ): Promise<Alert> {
    const existing = await query<{ id: string; status: AlertStatus }>(
      "SELECT id, status FROM alerts WHERE id = $1;",
      [id]
    );
    if (existing.rows.length === 0) {
      throw new NotFoundError(`Alert with ID ${id} not found`);
    }

    const currentStatus = existing.rows[0].status;

    // An alert is a one-way triage workflow.  Terminal decisions must not be
    // overwritten accidentally by a second click or a stale browser tab.
    if (currentStatus === "resolved" || currentStatus === "false_positive") {
      if (currentStatus === input.status) {
        const current = await query<Alert>(
          `SELECT id, classified_event_id, severity, status, sent_at, acknowledged_by
           FROM alerts WHERE id = $1;`,
          [id]
        );
        return current.rows[0];
      }
      throw new ConflictError(`Alert is already closed as '${currentStatus}' and cannot be changed.`);
    }

    const allowedTransitions: Record<"new" | "acknowledged", AlertStatus[]> = {
      new: ["acknowledged", "resolved", "false_positive"],
      acknowledged: ["resolved", "false_positive"],
    };

    if (input.status === "new" || !allowedTransitions[currentStatus as "new" | "acknowledged"].includes(input.status)) {
      throw new ConflictError(`Cannot change alert status from '${currentStatus}' to '${input.status}'.`);
    }

    const res = await query<Alert>(
      `UPDATE alerts
       SET status = $1,
           acknowledged_by = $2
       WHERE id = $3
       RETURNING id, classified_event_id, severity, status, sent_at, acknowledged_by;`,
      [input.status, userId, id]
    );

    return res.rows[0];
  }
}

