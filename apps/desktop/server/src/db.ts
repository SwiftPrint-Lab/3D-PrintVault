import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured.",
  );
}

export const pool =
  new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV ===
      "production"
        ? {
            rejectUnauthorized:
              false,
          }
        : undefined,
  });

export async function checkDatabaseConnection() {
  const client =
    await pool.connect();

  try {
    const result =
      await client.query(
        "SELECT NOW() AS now",
      );

    return result.rows[0];
  } finally {
    client.release();
  }
}
