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

      // 4. Seed Hotspots (Disabled for pure live stream focus)
      // console.log("🔥 Seeding recent hotspots...");
      // OMITTED to prevent static data appearing on dashboard

      // 5. Seed Events
      // OMITTED to prevent static data appearing on dashboard

      // 6. Alerts
      // OMITTED to prevent static data appearing on dashboard

      console.log("✅ Initial Database Scaffold Complete!");
    });
  } catch (err) {
    console.error("❌ Failed to seed initial data:", err);
  }
}
