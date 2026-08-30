import { FirmsIngestionService } from "../ingestion/firms/service";
import pool from "../db";
import logger from "../utils/logger";

async function main() {
  logger.info("🔥 [CLI] Running manual NASA FIRMS ingestion...");
  try {
    const result = await FirmsIngestionService.run();
    console.log("\n==========================================");
    console.log("   NASA FIRMS Ingestion Summary");
    console.log("==========================================");
    console.log(`Source:            ${result.source}`);
    console.log(`Records Fetched:   ${result.records_fetched}`);
    console.log(`Records Accepted:  ${result.records_accepted}`);
    console.log(`Records Inserted:  ${result.records_inserted}`);
    console.log(`Duplicates Skipped:${result.duplicates_skipped}`);
    console.log(`Invalid Rows:      ${result.invalid_count}`);
    console.log(`Duration:          ${result.duration_ms}ms`);
    console.log("==========================================\n");
  } catch (err: any) {
    logger.error(`[CLI] FIRMS ingestion failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

