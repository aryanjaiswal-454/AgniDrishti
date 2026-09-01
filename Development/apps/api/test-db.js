import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://agnidrishti:agnidrishti_dev@127.0.0.1:5432/agnidrishti" });
async function run() {
  try {
    const res = await pool.query(
        `INSERT INTO users (name, email, role, auth_provider)
         VALUES ($1, $2, 'viewer', 'firebase')
         RETURNING id, name, email, role, created_at;`,
        ["Test User", "test@example.com"]
    );
    console.log(res.rows[0]);
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}
run();
