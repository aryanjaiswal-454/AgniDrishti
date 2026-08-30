import { query } from "../db";
import { FacilityQueryInput } from "../schemas/facility.schema";
import { Facility, FacilityBaseline } from "@agnidrishti/shared-types";
import { NotFoundError } from "../utils/errors";

export interface FacilityWithDetails extends Facility {
  baseline?: FacilityBaseline | null;
  total_events?: number;
  anomalous_events_count?: number;
}

export interface FacilityTimeseriesPoint {
  date: string;
  avg_frp: number;
  max_frp: number;
  detections_count: number;
  anomalous_count: number;
}

export class FacilityService {
  /**
   * List facilities with multi-criteria filtering and spatial bbox support.
   */
  static async getFacilities(filters: FacilityQueryInput): Promise<{ facilities: Facility[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.facility_type) {
      conditions.push(`f.facility_type = $${idx++}`);
      values.push(filters.facility_type);
    }

    if (filters.state) {
      conditions.push(`f.state ILIKE $${idx++}`);
      values.push(`%${filters.state}%`);
    }

    if (filters.district) {
      conditions.push(`f.district ILIKE $${idx++}`);
      values.push(`%${filters.district}%`);
    }

    if (filters.search) {
      conditions.push(`f.name ILIKE $${idx++}`);
      values.push(`%${filters.search}%`);
    }

    // Spatial bounding box: minLon,minLat,maxLon,maxLat
    if (filters.bbox) {
      const [minLon, minLat, maxLon, maxLat] = filters.bbox.split(",").map(Number);
      conditions.push(`ST_Intersects(f.geometry, ST_MakeEnvelope($${idx++}, $${idx++}, $${idx++}, $${idx++}, 4326))`);
      values.push(minLon, minLat, maxLon, maxLat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total matching
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM facilities f ${whereClause};`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    // Fetch paginated results with GeoJSON geometry
    const limit = filters.limit;
    const offset = filters.offset;
    values.push(limit, offset);

    const facilitiesRes = await query<Facility>(
      `SELECT
        f.id,
        f.osm_id,
        f.name,
        f.facility_type,
        ST_AsGeoJSON(f.geometry)::jsonb as geometry,
        f.state,
        f.district,
        f.source,
        f.last_synced_at,
        f.created_at
       FROM facilities f
       ${whereClause}
       ORDER BY f.name ASC NULLS LAST
       LIMIT $${idx++} OFFSET $${idx++};`,
      values
    );

    return {
      facilities: facilitiesRes.rows,
      total,
    };
  }

  /**
   * Get single facility by UUID with baseline stats and event summary.
   */
  static async getFacilityById(id: string): Promise<FacilityWithDetails> {
    const facilityRes = await query<Facility>(
      `SELECT
        f.id,
        f.osm_id,
        f.name,
        f.facility_type,
        ST_AsGeoJSON(f.geometry)::jsonb as geometry,
        f.state,
        f.district,
        f.source,
        f.last_synced_at,
        f.created_at
       FROM facilities f
       WHERE f.id = $1;`,
      [id]
    );

    const facility = facilityRes.rows[0];
    if (!facility) {
      throw new NotFoundError(`Facility with ID ${id} not found`);
    }

    // Baseline statistics
    const baselineRes = await query<FacilityBaseline>(
      `SELECT id, facility_id, avg_daily_detections, avg_frp, std_dev_frp, window_start, window_end, updated_at
       FROM facility_baselines
       WHERE facility_id = $1;`,
      [id]
    );

    // Event summary metrics
    const statsRes = await query<{ total_events: string; anomalous_count: string }>(
      `SELECT
        COUNT(*)::text as total_events,
        COUNT(CASE WHEN is_anomalous THEN 1 END)::text as anomalous_count
       FROM classified_events
       WHERE facility_id = $1;`,
      [id]
    );

    return {
      ...facility,
      baseline: baselineRes.rows[0] || null,
      total_events: parseInt(statsRes.rows[0]?.total_events || "0", 10),
      anomalous_events_count: parseInt(statsRes.rows[0]?.anomalous_count || "0", 10),
    };
  }

  /**
   * Get facility thermal timeseries aggregated for Recharts.
   */
  static async getFacilityTimeseries(id: string): Promise<FacilityTimeseriesPoint[]> {
    // Check if facility exists
    const facilityExists = await query("SELECT id FROM facilities WHERE id = $1;", [id]);
    if (facilityExists.rows.length === 0) {
      throw new NotFoundError(`Facility with ID ${id} not found`);
    }

    const res = await query<FacilityTimeseriesPoint>(
      `SELECT
        TO_CHAR(h.acq_date, 'YYYY-MM-DD') as date,
        ROUND(AVG(h.frp)::numeric, 2) as avg_frp,
        ROUND(MAX(h.frp)::numeric, 2) as max_frp,
        COUNT(h.id)::int as detections_count,
        COUNT(CASE WHEN ce.is_anomalous THEN 1 END)::int as anomalous_count
       FROM classified_events ce
       JOIN hotspots h ON ce.hotspot_id = h.id
       WHERE ce.facility_id = $1
       GROUP BY h.acq_date
       ORDER BY h.acq_date ASC;`,
      [id]
    );

    return res.rows;
  }
}

