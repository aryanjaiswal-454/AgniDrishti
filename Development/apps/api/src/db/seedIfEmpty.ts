import { pool, withTransaction } from "./index";
import bcrypt from "bcryptjs";

export async function seedIfEmpty() {
  try {
    const facilitiesCount = await pool.query("SELECT COUNT(*) FROM facilities;");
    const hotspotsCount = await pool.query("SELECT COUNT(*) FROM hotspots;");

    if (parseInt(facilitiesCount.rows[0].count) > 0 || parseInt(hotspotsCount.rows[0].count) > 0) {
      console.log("⏩ Database already contains facilities or hotspots. Skipping initial seed.");
      return;
    }

    console.log("🌱 Database is empty! Starting AgniDrishti Initial Data Seeding...");

    await withTransaction(async (client) => {
      // 1. Check if we need to seed users
      const usersCount = await client.query("SELECT COUNT(*) FROM users;");
      let analystId = null;

      if (parseInt(usersCount.rows[0].count) === 0) {
        console.log("👤 Seeding system users because users table is empty...");
        const salt = await bcrypt.genSalt(10);
        const adminPassHash = await bcrypt.hash("AdminPassword123!", salt);
        const analystPassHash = await bcrypt.hash("AnalystPassword123!", salt);
        const viewerPassHash = await bcrypt.hash("ViewerPassword123!", salt);

        await client.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'admin');`,
          ["System Administrator", "admin@agnidrishti.local", adminPassHash]
        );

        const userAnalystRes = await client.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'analyst')
           RETURNING id;`,
          ["Duty Thermal Analyst", "analyst@agnidrishti.local", analystPassHash]
        );
        analystId = userAnalystRes.rows[0].id;

        await client.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'viewer');`,
          ["National Observer", "viewer@agnidrishti.local", viewerPassHash]
        );
      } else {
        // Find an analyst ID if available, otherwise just use any user or null
        const userRes = await client.query("SELECT id FROM users WHERE role = 'analyst' LIMIT 1;");
        if (userRes.rows.length > 0) {
          analystId = userRes.rows[0].id;
        }
      }

      // 2. Seed Facilities
      console.log("🏭 Seeding industrial facilities...");
      const facilitiesData = [
        { osm_id: "osm_way_10123456", name: "Jamnagar Refinery Complex (Reliance)", facility_type: "refinery", lat: 22.3556, lon: 69.8519, state: "Gujarat", district: "Jamnagar" },
        { osm_id: "osm_way_20987654", name: "Mathura Oil Refinery (IOCL)", facility_type: "refinery", lat: 27.4239, lon: 77.6972, state: "Uttar Pradesh", district: "Mathura" },
        { osm_id: "osm_way_30456789", name: "Vindhyachal Super Thermal Power Station (NTPC)", facility_type: "power_plant", lat: 24.0984, lon: 82.6644, state: "Madhya Pradesh", district: "Singrauli" },
        { osm_id: "osm_way_40112233", name: "Bokaro Steel Plant (SAIL)", facility_type: "steel", lat: 23.6693, lon: 86.1511, state: "Jharkhand", district: "Bokaro" },
      ];

      const facilityMap: Record<string, string> = {};
      for (const f of facilitiesData) {
        const res = await client.query(
          `INSERT INTO facilities (osm_id, name, facility_type, geometry, state, district, source, last_synced_at)
           VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, 'osm', NOW())
           RETURNING id;`,
          [f.osm_id, f.name, f.facility_type, f.lon, f.lat, f.state, f.district]
        );
        facilityMap[f.osm_id] = res.rows[0].id;
      }

      // 3. Seed Baselines
      const baselineData = [
        { osm_id: "osm_way_10123456", avg_daily: 4.2, avg_frp: 85.5, std_dev_frp: 14.2 },
        { osm_id: "osm_way_20987654", avg_daily: 2.1, avg_frp: 45.2, std_dev_frp: 8.7 },
        { osm_id: "osm_way_30456789", avg_daily: 3.5, avg_frp: 62.0, std_dev_frp: 11.5 },
        { osm_id: "osm_way_40112233", avg_daily: 1.8, avg_frp: 38.4, std_dev_frp: 9.1 },
      ];

      for (const b of baselineData) {
        const facilityId = facilityMap[b.osm_id];
        if (facilityId) {
          await client.query(
            `INSERT INTO facility_baselines (
              facility_id, avg_daily_detections, avg_frp, std_dev_frp, window_start, window_end, updated_at
            ) VALUES ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, NOW());`,
            [facilityId, b.avg_daily, b.avg_frp, b.std_dev_frp]
          );
        }
      }

      // 4. Seed Hotspots (Use CURRENT_DATE to look recent!)
      console.log("🔥 Seeding recent hotspots...");
      const today = new Date().toISOString().split('T')[0];
      const hotspotsData = [
        { lat: 22.3562, lon: 69.8525, acq_date: today, acq_time: "1830", satellite: "N", instrument: "VIIRS", confidence: "nominal", frp: 88.2, bright_ti4: 338.5, daynight: "N", payload: { scan: 0.4, track: 0.38, version: "2.0NRT" } },
        { lat: 23.6712, lon: 86.1534, acq_date: today, acq_time: "1945", satellite: "N", instrument: "VIIRS", confidence: "high", frp: 185.0, bright_ti4: 367.2, daynight: "N", payload: { scan: 0.38, track: 0.36, version: "2.0NRT" } },
        { lat: 21.8542, lon: 86.3421, acq_date: today, acq_time: "0750", satellite: "1", instrument: "MODIS", confidence: "88", frp: 142.6, bright_ti4: 325.4, daynight: "D", payload: { scan: 1.1, track: 1.0, version: "6.1NRT" } },
        { lat: 30.9010, lon: 75.8573, acq_date: today, acq_time: "0815", satellite: "N", instrument: "VIIRS", confidence: "nominal", frp: 48.3, bright_ti4: 318.0, daynight: "D", payload: { scan: 0.42, track: 0.4, version: "2.0NRT" } },
      ];

      const hotspotIds: string[] = [];
      for (const h of hotspotsData) {
        const res = await client.query(
          `INSERT INTO hotspots (
            latitude, longitude, geometry, acq_date, acq_time, satellite, instrument,
            confidence, frp, bright_ti4, daynight, raw_payload, ingested_at
          ) VALUES (
            $1, $2, ST_SetSRID(ST_MakePoint($2, $1), 4326), $3, $4, $5, $6,
            $7, $8, $9, $10, $11, NOW()
          ) RETURNING id;`,
          [h.lat, h.lon, h.acq_date, h.acq_time, h.satellite, h.instrument, h.confidence, h.frp, h.bright_ti4, h.daynight, JSON.stringify(h.payload)]
        );
        hotspotIds.push(res.rows[0].id);
      }

      // 5. Seed Events
      const eventsData = [
        { hotspot_id: hotspotIds[0], facility_id: facilityMap["osm_way_10123456"], primary_class: "industrial", sub_class: "gas_flare", land_cover_type: "built_up", distance_to_facility_m: 85, recurrence_count_90d: 48, z_score_frp: 0.19, confidence_score: 0.94, model_version: "v1.0.0", is_anomalous: false },
        { hotspot_id: hotspotIds[1], facility_id: facilityMap["osm_way_40112233"], primary_class: "industrial", sub_class: "industrial_fire", land_cover_type: "built_up", distance_to_facility_m: 140, recurrence_count_90d: 2, z_score_frp: 3.82, confidence_score: 0.96, model_version: "v1.0.0", is_anomalous: true },
        { hotspot_id: hotspotIds[2], facility_id: null, primary_class: "natural", sub_class: "forest_fire", land_cover_type: "forest", distance_to_facility_m: 48200, recurrence_count_90d: 0, z_score_frp: null, confidence_score: 0.91, model_version: "v1.0.0", is_anomalous: false },
        { hotspot_id: hotspotIds[3], facility_id: null, primary_class: "natural", sub_class: "agricultural_burning", land_cover_type: "cropland", distance_to_facility_m: 35600, recurrence_count_90d: 3, z_score_frp: null, confidence_score: 0.89, model_version: "v1.0.0", is_anomalous: false },
      ];

      const eventIds: string[] = [];
      for (const e of eventsData) {
        const res = await client.query(
          `INSERT INTO classified_events (
            hotspot_id, facility_id, primary_class, sub_class, land_cover_type,
            distance_to_facility_m, recurrence_count_90d, z_score_frp, confidence_score,
            model_version, is_anomalous, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
          ) RETURNING id;`,
          [e.hotspot_id, e.facility_id, e.primary_class, e.sub_class, e.land_cover_type, e.distance_to_facility_m, e.recurrence_count_90d, e.z_score_frp, e.confidence_score, e.model_version, e.is_anomalous]
        );
        eventIds.push(res.rows[0].id);
      }

      // 6. Alerts
      await client.query(
        `INSERT INTO alerts (classified_event_id, severity, status, sent_at, acknowledged_by)
         VALUES ($1, 'high', 'new', NOW() - INTERVAL '5 minutes', NULL);`,
        [eventIds[1]]
      );

      if (analystId) {
        await client.query(
          `INSERT INTO alerts (classified_event_id, severity, status, sent_at, acknowledged_by)
           VALUES ($1, 'medium', 'acknowledged', NOW() - INTERVAL '2 hours', $2);`,
          [eventIds[0], analystId]
        );
      }

      console.log("✅ Initial Data Seeded!");
    });
  } catch (err) {
    console.error("❌ Failed to seed initial data:", err);
  }
}
