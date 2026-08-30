import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";
import path from "path";

// Ensure environment variables from root .env are loaded
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,

      // Only use SSL when a CA certificate is provided.
      ...(process.env.PGSSLROOTCERT
        ? {
            ssl: {
              ca: process.env.PGSSLROOTCERT,
              rejectUnauthorized: true,
            },
          }
     : {}),
    }
  : {
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
      database: process.env.POSTGRES_DB || "aagnazar",
      user: process.env.POSTGRES_USER || "aagnazar",
      password: process.env.POSTGRES_PASSWORD || "aagnazar_dev",
    };

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

/**
 * Execute a parameterized query with the connection pool.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development" && process.env.DEBUG_SQL === "true") {
    console.log("executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Execute work inside a single transactional client.
 */
export async function withTransaction<T>(
  callback: (client: import("pg").PoolClient) => Promise<T>
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
 * Health check to verify database connectivity and PostGIS availability.
 */
export async function testDbConnection(): Promise<{ ok: boolean; postgisVersion?: string; error?: string }> {
  try {
    const result = await pool.query<{ postgis_version: string }>(
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

