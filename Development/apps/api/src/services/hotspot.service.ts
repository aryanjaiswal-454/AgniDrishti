import { query } from "../db";
import { HotspotQueryInput } from "../schemas/hotspot.schema";
import { Hotspot } from "@agnidrishti/shared-types";
import { NotFoundError } from "../utils/errors";

export class HotspotService {
  /**
   * List raw NASA FIRMS hotspots with geospatial and sensor filters.
   */
  static async getHotspots(filters: HotspotQueryInput): Promise<{ hotspots: Hotspot[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.startDate) {
      conditions.push(`h.acq_date >= $${idx++}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`h.acq_date <= $${idx++}`);
      values.push(filters.endDate);
    }

    if (filters.instrument) {
      conditions.push(`h.instrument = $${idx++}`);
      values.push(filters.instrument);
    }

    if (filters.satellite) {
      conditions.push(`h.satellite = $${idx++}`);
      values.push(filters.satellite);
    }

    if (filters.daynight) {
      conditions.push(`h.daynight = $${idx++}`);
      values.push(filters.daynight);
    }

    // Spatial bounding box: minLon,minLat,maxLon,maxLat
    if (filters.bbox) {
      const [minLon, minLat, maxLon, maxLat] = filters.bbox.split(",").map(Number);
      conditions.push(`ST_Intersects(h.geometry, ST_MakeEnvelope($${idx++}, $${idx++}, $${idx++}, $${idx++}, 4326))`);
      values.push(minLon, minLat, maxLon, maxLat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM hotspots h ${whereClause};`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    // Results
    const limit = filters.limit;
    const offset = filters.offset;
    values.push(limit, offset);

    const hotspotsRes = await query<Hotspot>(
      `SELECT
        h.id,
        h.latitude,
        h.longitude,
        ST_AsGeoJSON(h.geometry)::jsonb as geometry,
        TO_CHAR(h.acq_date, 'YYYY-MM-DD') as acq_date,
        h.acq_time,
        h.satellite,
        h.instrument,
        h.confidence,
        h.frp,
        h.bright_ti4,
        h.daynight,
        h.raw_payload,
        h.ingested_at
       FROM hotspots h
       ${whereClause}
       ORDER BY h.acq_date DESC, h.acq_time DESC
       LIMIT $${idx++} OFFSET $${idx++};`,
      values
    );

    return {
      hotspots: hotspotsRes.rows,
      total,
    };
  }

  /**
   * Get single raw hotspot by UUID.
   */
  static async getHotspotById(id: string): Promise<Hotspot> {
    const res = await query<Hotspot>(
      `SELECT
        h.id,
        h.latitude,
        h.longitude,
        ST_AsGeoJSON(h.geometry)::jsonb as geometry,
        TO_CHAR(h.acq_date, 'YYYY-MM-DD') as acq_date,
        h.acq_time,
        h.satellite,
        h.instrument,
        h.confidence,
        h.frp,
        h.bright_ti4,
        h.daynight,
        h.raw_payload,
        h.ingested_at
       FROM hotspots h
       WHERE h.id = $1;`,
      [id]
    );

    const hotspot = res.rows[0];
    if (!hotspot) {
      throw new NotFoundError(`Hotspot with ID ${id} not found`);
    }

    return hotspot;
  }
}

