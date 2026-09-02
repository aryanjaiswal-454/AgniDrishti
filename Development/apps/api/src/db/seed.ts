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
      // HOTSPOTS, EVENTS, and ALERTS seeding removed to prevent static data pollution
      console.log("
✅ AgniDrishti Database seeded successfully!");undefined