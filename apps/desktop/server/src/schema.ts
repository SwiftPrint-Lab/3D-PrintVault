import { pool } from "./db.js";
import {
  hashActivationToken,
} from "./token.js";

export async function initializeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id BIGSERIAL PRIMARY KEY,
      license_key TEXT NOT NULL UNIQUE,
      product TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      max_activations INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activations (
      id BIGSERIAL PRIMARY KEY,
      license_id BIGINT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      activation_token TEXT NOT NULL UNIQUE,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_validated_at TIMESTAMPTZ,
      deactivated_at TIMESTAMPTZ,
      UNIQUE (license_id, device_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_licenses_license_key
    ON licenses (license_key)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_activations_token
    ON activations (activation_token)
  `);

  /*
   * Migrate legacy plaintext activation tokens.
   *
   * Existing desktop installations retain their original
   * bearer token. The API hashes incoming bearer tokens
   * before querying PostgreSQL, so existing installations
   * continue working after this migration.
   */
  const legacyTokens =
    await pool.query<{
      id: string;
      activation_token: string;
    }>(
      `
        SELECT
          id,
          activation_token
        FROM activations
        WHERE activation_token NOT LIKE 'sha256:%'
      `,
    );

  for (
    const activation
    of legacyTokens.rows
  ) {
    await pool.query(
      `
        UPDATE activations
        SET activation_token = $1
        WHERE id = $2
      `,
      [
        hashActivationToken(
          activation.activation_token,
        ),
        activation.id,
      ],
    );
  }
}
