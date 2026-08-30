import { Response } from "express";
import { query } from "../db";
import { ExportQueryInput } from "../schemas/feedback.schema";

export class ExportService {
  /**
   * Export filtered classified events in CSV or JSON format.
   */
  static async exportData(filters: ExportQueryInput, res: Response): Promise<void> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.primary_class) {
      conditions.push(`ce.primary_class = $${idx++}`);
      values.push(filters.primary_class);
    }

    if (filters.sub_class) {
      conditions.push(`ce.sub_class = $${idx++}`);
      values.push(filters.sub_class);
    }

    if (filters.startDate) {
      conditions.push(`h.acq_date >= $${idx++}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`h.acq_date <= $${idx++}`);
      values.push(filters.endDate);
    }

    if (filters.state) {
      conditions.push(`f.state ILIKE $${idx++}`);
      values.push(`%${filters.state}%`);
    }

    if (filters.district) {
      conditions.push(`f.district ILIKE $${idx++}`);
      values.push(`%${filters.district}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataRes = await query<any>(
      `SELECT
        ce.id as event_id,
        ce.hotspot_id,
        TO_CHAR(h.acq_date, 'YYYY-MM-DD') as acq_date,
        h.acq_time,
        h.latitude,
        h.longitude,
        h.instrument,
        h.satellite,
        h.frp,
        h.bright_ti4,
        ce.primary_class,
        ce.sub_class,
        ce.land_cover_type,
        ce.confidence_score,
        ce.is_anomalous,
        ce.distance_to_facility_m,
        f.name as facility_name,
        f.facility_type,
        f.state as facility_state,
        f.district as facility_district,
        ce.created_at
       FROM classified_events ce
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       ${whereClause}
       ORDER BY h.acq_date DESC, h.acq_time DESC
       LIMIT 5000;`,
      values
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (filters.format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="agnidrishti-events-${timestamp}.csv"`
      );

      // CSV Header
      const headers = [
        "event_id",
        "hotspot_id",
        "acq_date",
        "acq_time",
        "latitude",
        "longitude",
        "instrument",
        "satellite",
        "frp",
        "bright_ti4",
        "primary_class",
        "sub_class",
        "land_cover_type",
        "confidence_score",
        "is_anomalous",
        "distance_to_facility_m",
        "facility_name",
        "facility_type",
        "facility_state",
        "facility_district",
        "created_at",
      ];
      res.write(headers.join(",") + "\n");

      // Write CSV rows
      for (const row of dataRes.rows) {
        const line = headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const strVal = String(val);
            if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
              return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
          })
          .join(",");
        res.write(line + "\n");
      }
      res.end();
    } else {
      // JSON format
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="agnidrishti-events-${timestamp}.json"`
      );
      res.json({
        success: true,
        count: dataRes.rows.length,
        data: dataRes.rows,
        exported_at: new Date().toISOString(),
      });
    }
  }
}

