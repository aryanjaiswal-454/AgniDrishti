import { query } from "../db";
import { EventQueryInput } from "../schemas/event.schema";
import { ClassifiedEvent, Facility, Hotspot, Feedback } from "@agnidrishti/shared-types";
import { NotFoundError } from "../utils/errors";

export interface ClassifiedEventWithDetails extends ClassifiedEvent {
  hotspot?: Hotspot;
  facility?: Facility | null;
  feedback_history?: Feedback[];
}

export class EventService {
  /**
   * List classified events with multi-criteria filtering, joins, and spatial constraints.
   */
  static async getEvents(filters: EventQueryInput): Promise<{ events: ClassifiedEventWithDetails[]; total: number }> {
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

    if (filters.facility_id) {
      conditions.push(`ce.facility_id = $${idx++}`);
      values.push(filters.facility_id);
    }

    if (filters.is_anomalous !== undefined) {
      conditions.push(`ce.is_anomalous = $${idx++}`);
      values.push(filters.is_anomalous);
    }

    if (filters.min_confidence !== undefined) {
      conditions.push(`ce.confidence_score >= $${idx++}`);
      values.push(filters.min_confidence);
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

    // Spatial bounding box: minLon,minLat,maxLon,maxLat
    if (filters.bbox) {
      const [minLon, minLat, maxLon, maxLat] = filters.bbox.split(",").map(Number);
      conditions.push(`ST_Intersects(h.geometry, ST_MakeEnvelope($${idx++}, $${idx++}, $${idx++}, $${idx++}, 4326))`);
      values.push(minLon, minLat, maxLon, maxLat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM classified_events ce
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       ${whereClause};`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    // Results
    const limit = filters.limit;
    const offset = filters.offset;
    values.push(limit, offset);

    const eventsRes = await query<any>(
      `SELECT
        ce.id,
        ce.hotspot_id,
        ce.facility_id,
        ce.primary_class,
        ce.sub_class,
        ce.land_cover_type,
        ce.distance_to_facility_m,
        ce.recurrence_count_90d,
        ce.z_score_frp,
        ce.confidence_score,
        ce.model_version,
        ce.is_anomalous,
        ce.created_at,
        -- Hotspot details
        h.latitude,
        h.longitude,
        TO_CHAR(h.acq_date, 'YYYY-MM-DD') as acq_date,
        h.acq_time,
        h.satellite,
        h.instrument,
        h.confidence as hotspot_confidence,
        h.frp,
        h.bright_ti4,
        h.daynight,
        ST_AsGeoJSON(h.geometry)::jsonb as hotspot_geometry,
        -- Facility details
        f.name as facility_name,
        f.facility_type,
        f.state as facility_state,
        f.district as facility_district
       FROM classified_events ce
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       ${whereClause}
       ORDER BY ce.created_at DESC, h.acq_date DESC
       LIMIT $${idx++} OFFSET $${idx++};`,
      values
    );

    const formattedEvents: ClassifiedEventWithDetails[] = eventsRes.rows.map((row) => ({
      id: row.id,
      hotspot_id: row.hotspot_id,
      facility_id: row.facility_id,
      primary_class: row.primary_class,
      sub_class: row.sub_class,
      land_cover_type: row.land_cover_type,
      distance_to_facility_m: row.distance_to_facility_m ? parseFloat(row.distance_to_facility_m) : null,
      recurrence_count_90d: row.recurrence_count_90d,
      z_score_frp: row.z_score_frp ? parseFloat(row.z_score_frp) : null,
      confidence_score: parseFloat(row.confidence_score),
      model_version: row.model_version,
      is_anomalous: row.is_anomalous,
      created_at: row.created_at,
      hotspot: {
        id: row.hotspot_id,
        latitude: row.latitude,
        longitude: row.longitude,
        geometry: row.hotspot_geometry,
        acq_date: row.acq_date,
        acq_time: row.acq_time,
        satellite: row.satellite,
        instrument: row.instrument,
        confidence: row.hotspot_confidence,
        frp: row.frp ? parseFloat(row.frp) : null,
        bright_ti4: row.bright_ti4 ? parseFloat(row.bright_ti4) : null,
        daynight: row.daynight,
        ingested_at: row.created_at,
      },
      facility: row.facility_id
        ? {
            id: row.facility_id,
            osm_id: "",
            name: row.facility_name,
            facility_type: row.facility_type,
            geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
            state: row.facility_state,
            district: row.facility_district,
            source: "osm",
            last_synced_at: null,
          }
        : null,
    }));

    return {
      events: formattedEvents,
      total,
    };
  }

  /**
   * Get single classified event by UUID with full details, linked facility, and feedback history.
   */
  static async getEventById(id: string): Promise<ClassifiedEventWithDetails> {
    const eventRes = await query<any>(
      `SELECT
        ce.id,
        ce.hotspot_id,
        ce.facility_id,
        ce.primary_class,
        ce.sub_class,
        ce.land_cover_type,
        ce.distance_to_facility_m,
        ce.recurrence_count_90d,
        ce.z_score_frp,
        ce.confidence_score,
        ce.model_version,
        ce.is_anomalous,
        ce.created_at,
        -- Hotspot details
        h.latitude,
        h.longitude,
        TO_CHAR(h.acq_date, 'YYYY-MM-DD') as acq_date,
        h.acq_time,
        h.satellite,
        h.instrument,
        h.confidence as hotspot_confidence,
        h.frp,
        h.bright_ti4,
        h.daynight,
        h.raw_payload,
        ST_AsGeoJSON(h.geometry)::jsonb as hotspot_geometry,
        -- Facility details
        f.osm_id as facility_osm_id,
        f.name as facility_name,
        f.facility_type,
        f.state as facility_state,
        f.district as facility_district,
        ST_AsGeoJSON(f.geometry)::jsonb as facility_geometry
       FROM classified_events ce
       JOIN hotspots h ON ce.hotspot_id = h.id
       LEFT JOIN facilities f ON ce.facility_id = f.id
       WHERE ce.id = $1;`,
      [id]
    );

    const row = eventRes.rows[0];
    if (!row) {
      throw new NotFoundError(`Classified event with ID ${id} not found`);
    }

    // Feedback history
    const feedbackRes = await query<Feedback>(
      `SELECT id, classified_event_id, user_id, corrected_label, notes, created_at
       FROM feedback
       WHERE classified_event_id = $1
       ORDER BY created_at DESC;`,
      [id]
    );

    return {
      id: row.id,
      hotspot_id: row.hotspot_id,
      facility_id: row.facility_id,
      primary_class: row.primary_class,
      sub_class: row.sub_class,
      land_cover_type: row.land_cover_type,
      distance_to_facility_m: row.distance_to_facility_m ? parseFloat(row.distance_to_facility_m) : null,
      recurrence_count_90d: row.recurrence_count_90d,
      z_score_frp: row.z_score_frp ? parseFloat(row.z_score_frp) : null,
      confidence_score: parseFloat(row.confidence_score),
      model_version: row.model_version,
      is_anomalous: row.is_anomalous,
      created_at: row.created_at,
      hotspot: {
        id: row.hotspot_id,
        latitude: row.latitude,
        longitude: row.longitude,
        geometry: row.hotspot_geometry,
        acq_date: row.acq_date,
        acq_time: row.acq_time,
        satellite: row.satellite,
        instrument: row.instrument,
        confidence: row.hotspot_confidence,
        frp: row.frp ? parseFloat(row.frp) : null,
        bright_ti4: row.bright_ti4 ? parseFloat(row.bright_ti4) : null,
        daynight: row.daynight,
        raw_payload: row.raw_payload,
        ingested_at: row.created_at,
      },
      facility: row.facility_id
        ? {
            id: row.facility_id,
            osm_id: row.facility_osm_id,
            name: row.facility_name,
            facility_type: row.facility_type,
            geometry: row.facility_geometry,
            state: row.facility_state,
            district: row.facility_district,
            source: "osm",
            last_synced_at: null,
          }
        : null,
      feedback_history: feedbackRes.rows,
    };
  }
}

