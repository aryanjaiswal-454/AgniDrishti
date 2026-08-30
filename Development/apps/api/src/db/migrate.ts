import fs from "fs";
import path from "path";
import { pool, withTransaction } from "./index";

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

async function runMigrations() {
  console.log("🚀 Starting AgniDrishti Database Migration...");
  console.log(`📁 Scanning migrations in: ${MIGRATIONS_DIR}`);

  try {
    // 1. Ensure schema_migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Read migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log("No migrations directory found.");
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No SQL migration files found.");
      return;
    }

    // 3. Get applied migrations
    const appliedResult = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations;"
    );
    const appliedSet = new Set(appliedResult.rows.map((r) => r.name));

    // 4. Run pending migrations
    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ Skipping already applied migration: ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`⏳ Applying migration: ${file}...`);
      await withTransaction(async (client) => {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1);", [file]);
      });

      console.log(`✅ Applied migration: ${file}`);
      count++;
    }

    console.log(`\n🎉 Migration complete! ${count} new migration(s) applied successfully.`);
  } catch (error: any) {
    console.error("\n❌ Migration failed:");
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
  runMigrations();
}

export { runMigrations };

