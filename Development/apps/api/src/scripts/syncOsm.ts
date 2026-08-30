import { OsmSyncService } from "../ingestion/osm/service";
import pool from "../db";
import logger from "../utils/logger";

async function main() {
  logger.info("🏭 [CLI] Running manual OpenStreetMap facility synchronization...");
  try {
    const result = await OsmSyncService.run();
    console.log("\n==========================================");
    console.log("   OpenStreetMap Facility Sync Summary");
    console.log("==========================================");
    console.log(`Features Fetched:     ${result.features_fetched}`);
    console.log(`Facilities Upserted:  ${result.facilities_upserted}`);
    console.log(`Invalid Features:     ${result.invalid_features}`);
    console.log(`Duration:             ${result.duration_ms}ms`);
    console.log("==========================================\n");
  } catch (err: any) {
    logger.error(`[CLI] OSM facility sync failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

