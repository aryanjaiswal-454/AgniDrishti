import bcrypt from "bcryptjs";
import { pool, withTransaction } from "./index";

async function seedDatabase() {
  console.log("🌱 Starting AgniDrishti Database Seeding...");

  try {
    await withTransaction(async (client) => {
      // ----------------------------------------------------------------------
      // 1. Clean existing demo data in reverse foreign-key order
      // ----------------------------------------------------------------------
      console.log("🧹 Cleaning old demo data...");
      await client.query("TRUNCATE TABLE feedback CASCADE;");
      await client.query("TRUNCATE TABLE alerts CASCADE;");
      await client.query("TRUNCATE TABLE facility_baselines CASCADE;");
      await client.query("TRUNCATE TABLE classified_events CASCADE;");
      await client.query("TRUNCATE TABLE hotspots CASCADE;");
      await client.query("TRUNCATE TABLE facilities CASCADE;");
      await client.query("TRUNCATE TABLE users CASCADE;");

      // ----------------------------------------------------------------------
      // 2. Seed Users
      // ----------------------------------------------------------------------
      console.log("👤 Seeding system users...");
      const salt = await bcrypt.genSalt(10);
      const adminPassHash = await bcrypt.hash("AdminPassword123!", salt);
      const analystPassHash = await bcrypt.hash("AnalystPassword123!", salt);
      const viewerPassHash = await bcrypt.hash("ViewerPassword123!", salt);

      const userAdminRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id;`,
        ["System Administrator", "admin@agnidrishti.local", adminPassHash]
      );
      const adminId = userAdminRes.rows[0].id;

      const userAnalystRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'analyst')
         RETURNING id;`,
        ["Duty Thermal Analyst", "analyst@agnidrishti.local", analystPassHash]
      );
      const analystId = userAnalystRes.rows[0].id;

      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'viewer')
         RETURNING id;`,
        ["National Observer", "viewer@agnidrishti.local", viewerPassHash]
      );

      // ----------------------------------------------------------------------
      // 3. Seed Facilities (Representative Indian Industrial Infrastructure)
      // ----------------------------------------------------------------------
      console.log("🏭 Seeding industrial facilities...");
      const facilitiesData = [
        {
          osm_id: "osm_way_10123456",
          name: "Jamnagar Refinery Complex (Reliance)",
          facility_type: "refinery",
          lat: 22.3556,
          lon: 69.8519,
          state: "Gujarat",
          district: "Jamnagar",
        },
        {
          osm_id: "osm_way_20987654",
          name: "Mathura Oil Refinery (IOCL)",
          facility_type: "refinery",
          lat: 27.4239,
          lon: 77.6972,
          state: "Uttar Pradesh",
          district: "Mathura",
        },
        {
          osm_id: "osm_way_30456789",
          name: "Vindhyachal Super Thermal Power Station (NTPC)",
          facility_type: "power_plant",
          lat: 24.0984,
          lon: 82.6644,
          state: "Madhya Pradesh",
          district: "Singrauli",
        },
        {
          osm_id: "osm_way_40112233",
          name: "Bokaro Steel Plant (SAIL)",
          facility_type: "steel",
          lat: 23.6693,
          lon: 86.1511,
          state: "Jharkhand",
          district: "Bokaro",
        },
        {
          osm_id: "osm_way_50998877",
          name: "Bhilai Steel Plant (SAIL)",
          facility_type: "steel",
          lat: 21.1938,
          lon: 81.3838,
          state: "Chhattisgarh",
          district: "Durg",
        },
        {
          osm_id: "osm_way_60554433",
          name: "Dahej LNG Terminal (Petronet LNG)",
          facility_type: "lng_terminal",
          lat: 21.7032,
          lon: 72.5447,
          state: "Gujarat",
          district: "Bharuch",
        },
        {
          osm_id: "osm_way_70223344",
          name: "Jharia Open Cast Coal Mining Area",
          facility_type: "mining",
          lat: 23.7439,
          lon: 86.4172,
          state: "Jharkhand",
          district: "Dhanbad",
        },
        {
          osm_id: "osm_way_80667788",
          name: "Haldia Petrochemicals Complex",
          facility_type: "petrochemical",
          lat: 22.0624,
          lon: 88.0863,
          state: "West Bengal",
          district: "Purba Medinipur",
        },
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

      // ----------------------------------------------------------------------
      // 4. Seed Facility Baselines
      // ----------------------------------------------------------------------
      console.log("📊 Seeding facility baseline statistics...");
      const baselineData = [
        {
          osm_id: "osm_way_10123456", // Jamnagar
          avg_daily: 4.2,
          avg_frp: 85.5,
          std_dev_frp: 14.2,
        },
        {
          osm_id: "osm_way_20987654", // Mathura
          avg_daily: 2.1,
          avg_frp: 45.2,
          std_dev_frp: 8.7,
        },
        {
          osm_id: "osm_way_30456789", // Vindhyachal
          avg_daily: 3.5,
          avg_frp: 62.0,
          std_dev_frp: 11.5,
        },
        {
          osm_id: "osm_way_40112233", // Bokaro
          avg_daily: 1.8,
          avg_frp: 38.4,
          std_dev_frp: 9.1,
        },
        {
          osm_id: "osm_way_50998877", // Bhilai
          avg_daily: 2.3,
          avg_frp: 42.1,
          std_dev_frp: 10.3,
        },
        {
          osm_id: "osm_way_60554433", // Dahej
          avg_daily: 1.2,
          avg_frp: 32.0,
          std_dev_frp: 6.4,
        },
        {
          osm_id: "osm_way_70223344", // Jharia
          avg_daily: 6.8,
          avg_frp: 110.2,
          std_dev_frp: 28.5,
        },
        {
          osm_id: "osm_way_80667788", // Haldia
          avg_daily: 1.5,
          avg_frp: 35.8,
          std_dev_frp: 7.2,
        },
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

      // ----------------------------------------------------------------------
      // 5. Seed Hotspots (FIRMS format)
      // ----------------------------------------------------------------------
      console.log("🔥 Seeding FIRMS hotspots...");
      const hotspotsData = [
        // 1. Gas flare at Jamnagar (Continuous persistent flare)
        {
          lat: 22.3562,
          lon: 69.8525,
          acq_date: "2026-08-28",
          acq_time: "1830",
          satellite: "N",
          instrument: "VIIRS",
          confidence: "nominal",
          frp: 88.2,
          bright_ti4: 338.5,
          daynight: "N",
          payload: { scan: 0.4, track: 0.38, version: "2.0NRT" },
        },
        // 2. Anomaly: Spike at Bokaro Steel Plant (Simulated accidental fire)
        {
          lat: 23.6712,
          lon: 86.1534,
          acq_date: "2026-08-28",
          acq_time: "1945",
          satellite: "N",
          instrument: "VIIRS",
          confidence: "high",
          frp: 185.0, // Baseline is 38.4 -> massive spike
          bright_ti4: 367.2,
          daynight: "N",
          payload: { scan: 0.38, track: 0.36, version: "2.0NRT" },
        },
        // 3. Natural: Simlipal Forest Fire (Far from facilities, dense tree cover)
        {
          lat: 21.8542,
          lon: 86.3421,
          acq_date: "2026-08-28",
          acq_time: "0750",
          satellite: "1",
          instrument: "MODIS",
          confidence: "88",
          frp: 142.6,
          bright_ti4: 325.4,
          daynight: "D",
          payload: { scan: 1.1, track: 1.0, version: "6.1NRT" },
        },
        // 4. Natural: Agricultural Stubble Burning (Punjab cropland)
        {
          lat: 30.9010,
          lon: 75.8573,
          acq_date: "2026-08-28",
          acq_time: "0815",
          satellite: "N",
          instrument: "VIIRS",
          confidence: "nominal",
          frp: 48.3,
          bright_ti4: 318.0,
          daynight: "D",
          payload: { scan: 0.42, track: 0.4, version: "2.0NRT" },
        },
        // 5. Mining thermal source at Jharia
        {
          lat: 23.7445,
          lon: 86.4180,
          acq_date: "2026-08-28",
          acq_time: "1940",
          satellite: "N",
          instrument: "VIIRS",
          confidence: "high",
          frp: 118.4,
          bright_ti4: 345.8,
          daynight: "N",
          payload: { scan: 0.39, track: 0.37, version: "2.0NRT" },
        },
        // 6. Normal stack emission at Mathura Refinery
        {
          lat: 27.4245,
          lon: 77.6980,
          acq_date: "2026-08-28",
          acq_time: "1840",
          satellite: "N",
          instrument: "VIIRS",
          confidence: "nominal",
          frp: 47.1,
          bright_ti4: 326.5,
          daynight: "N",
          payload: { scan: 0.41, track: 0.39, version: "2.0NRT" },
        },
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
          [
            h.lat,
            h.lon,
            h.acq_date,
            h.acq_time,
            h.satellite,
            h.instrument,
            h.confidence,
            h.frp,
            h.bright_ti4,
            h.daynight,
            JSON.stringify(h.payload),
          ]
        );
        hotspotIds.push(res.rows[0].id);
      }

      // ----------------------------------------------------------------------
      // 6. Seed Classified Events
      // ----------------------------------------------------------------------
      console.log("🧠 Seeding AI classified events...");
      const eventsData = [
        // 1. Jamnagar Flare (Expected persistent source)
        {
          hotspot_id: hotspotIds[0],
          facility_id: facilityMap["osm_way_10123456"],
          primary_class: "industrial",
          sub_class: "gas_flare",
          land_cover_type: "built_up",
          distance_to_facility_m: 85,
          recurrence_count_90d: 48,
          z_score_frp: 0.19,
          confidence_score: 0.94,
          model_version: "v1.0.0-rules-ml-hybrid",
          is_anomalous: false,
        },
        // 2. Bokaro Industrial Fire (Anomalous fire event)
        {
          hotspot_id: hotspotIds[1],
          facility_id: facilityMap["osm_way_40112233"],
          primary_class: "industrial",
          sub_class: "industrial_fire",
          land_cover_type: "built_up",
          distance_to_facility_m: 140,
          recurrence_count_90d: 2,
          z_score_frp: 3.82, // (185 - 38.4) / 9.1 = 16.1 -> high anomaly
          confidence_score: 0.96,
          model_version: "v1.0.0-rules-ml-hybrid",
          is_anomalous: true,
        },
        // 3. Simlipal Forest Fire (Natural)
        {
          hotspot_id: hotspotIds[2],
          facility_id: null,
          primary_class: "natural",
          sub_class: "forest_fire",
          land_cover_type: "forest",
          distance_to_facility_m: 48200,
          recurrence_count_90d: 0,
          z_score_frp: null,
          confidence_score: 0.91,
          model_version: "v1.0.0-rules-ml-hybrid",
          is_anomalous: false,
        },
        // 4. Punjab Agricultural Burning (Natural)
        {
          hotspot_id: hotspotIds[3],
          facility_id: null,
          primary_class: "natural",
          sub_class: "agricultural_burning",
          land_cover_type: "cropland",
          distance_to_facility_m: 35600,
          recurrence_count_90d: 3,
          z_score_frp: null,
          confidence_score: 0.89,
          model_version: "v1.0.0-rules-ml-hybrid",
          is_anomalous: false,
        },
        // 5. Jharia Mining Thermal Source
        {
          hotspot_id: hotspotIds[4],
          facility_id: facilityMap["osm_way_70223344"],
          primary_class: "industrial",
          sub_class: "mining_activity",
          land_cover_type: "bare",
          distance_to_facility_m: 95,
          recurrence_count_90d: 62,
          z_score_frp: 0.29,
          confidence_score: 0.93,
          model_version: "v1.0.0-rules-ml-hybrid",
          is_anomalous: false,
        },
        // 6. Mathura Persistent Operation
        {
          hotspot_id: hotspotIds[5],
          facility_id: facilityMap["osm_way_20987654"],
          primary_class: "industrial",
          sub_class: "gas_flare",
          land_cover_type: "built_up",
          distance_to_facility_m: 110,
          recurrence_count_90d: 22,
          z_score_frp: 0.22,
          confidence_score: 0.90,
          model_version: "v1.0.0-rules-ml-hybrid",
          is_anomalous: false,
        },
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
          [
            e.hotspot_id,
            e.facility_id,
            e.primary_class,
            e.sub_class,
            e.land_cover_type,
            e.distance_to_facility_m,
            e.recurrence_count_90d,
            e.z_score_frp,
            e.confidence_score,
            e.model_version,
            e.is_anomalous,
          ]
        );
        eventIds.push(res.rows[0].id);
      }

      // ----------------------------------------------------------------------
      // 7. Seed Alerts (For anomalous / critical fire detections)
      // ----------------------------------------------------------------------
      console.log("🚨 Seeding real-time alerts...");
      // High severity alert for the Bokaro Steel industrial fire
      await client.query(
        `INSERT INTO alerts (classified_event_id, severity, status, sent_at, acknowledged_by)
         VALUES ($1, 'high', 'new', NOW() - INTERVAL '5 minutes', NULL);`,
        [eventIds[1]]
      );

      // Medium severity alert for elevated flare acknowledged by analyst
      await client.query(
        `INSERT INTO alerts (classified_event_id, severity, status, sent_at, acknowledged_by)
         VALUES ($1, 'medium', 'acknowledged', NOW() - INTERVAL '2 hours', $2);`,
        [eventIds[0], analystId]
      );

      // ----------------------------------------------------------------------
      // 8. Seed Analyst Feedback (Model retraining loop)
      // ----------------------------------------------------------------------
      console.log("📝 Seeding analyst feedback...");
      await client.query(
        `INSERT INTO feedback (classified_event_id, user_id, corrected_label, notes, created_at)
         VALUES ($1, $2, 'industrial_fire', 'Confirmed abnormal thermal bloom matching secondary converter area.', NOW() - INTERVAL '1 hour');`,
        [eventIds[1], analystId]
      );

      console.log("\n✅ AgniDrishti Database seeded successfully!");
      console.log(`   - 3 Users (admin: admin@agnidrishti.local / AdminPassword123!)`);
      console.log(`   - ${facilitiesData.length} Industrial Facilities`);
      console.log(`   - ${baselineData.length} Facility Baselines`);
      console.log(`   - ${hotspotsData.length} NASA FIRMS Hotspots`);
      console.log(`   - ${eventsData.length} AI Classified Events`);
      console.log(`   - 2 Real-Time Alerts`);
      console.log(`   - 1 Analyst Feedback Record`);
    });
  } catch (error: any) {
    console.error("\n❌ Database seeding failed:");
    console.error(error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Database connection was refused.");
      console.error("   Ensure PostgreSQL is running and reachable via your .env configuration.");
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };

