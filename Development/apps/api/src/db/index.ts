import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables from root .env in development
dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

// Aiven CA certificate
const caPath = path.resolve(__dirname, "../../ca.pem");

console.log("Aiven CA certificate exists:", fs.existsSync(caPath));
console.log("Aiven CA certificate path:", caPath);

if (!fs.existsSync(caPath) && process.env.DB_IGNORE_SSL !== "true") {
  throw new Error(`Aiven CA certificate not found at: ${caPath}`);
}

/*
 * IMPORTANT:
 * node-postgres replaces the ssl object if sslmode/sslrootcert/etc.
 * are present inside DATABASE_URL.
 *
 * Therefore remove SSL query parameters from DATABASE_URL and
 * configure SSL explicitly below.
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const dbUrl = new URL(databaseUrl);

dbUrl.searchParams.delete("sslmode");
dbUrl.searchParams.delete("sslrootcert");
dbUrl.searchParams.delete("sslcert");
dbUrl.searchParams.delete("sslkey");

const poolConfig: PoolConfig = {
  connectionString: dbUrl.toString(),
};

// Check if we want to bypass SSL (useful for local Docker testing)
if (process.env.DB_IGNORE_SSL !== "true") {
  poolConfig.ssl = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath, "utf8"),
  };
}

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error(
    "Unexpected error on idle PostgreSQL client:",
    err
  );
});

/**
 * Execute a parameterized query with the connection pool.
 */
export async function query<
  T extends QueryResultRow = any
>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();

  const res = await pool.query<T>(text, params);

  const duration = Date.now() - start;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEBUG_SQL === "true"
  ) {
    console.log("executed query", {
      text,
      duration,
      rows: res.rowCount,
    });
  }

  return res;
}

/**
 * Execute work inside a single transactional client.
 */
export async function withTransaction<T>(
  callback: (
    client: import("pg").PoolClient
  ) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Health check to verify database connectivity
 * and PostGIS availability.
 */
export async function testDbConnection(): Promise<{
  ok: boolean;
  postgisVersion?: string;
  error?: string;
}> {
  try {
    const result = await pool.query<{
      postgis_version: string;
    }>(
      "SELECT PostGIS_Version() as postgis_version;"
    );

    return {
      ok: true,
      postgisVersion: result.rows[0]?.postgis_version,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

export default pool;