import { pool } from "./db.js";

import {
  hashActivationToken,
} from "./token.js";

import {
  hashLicenseKey,
} from "./licenseKey.js";

export async function initializeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id BIGSERIAL PRIMARY KEY,
      license_key TEXT NOT NULL UNIQUE,
      license_key_hash TEXT,
      product TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      max_activations INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  /*
   * Existing installations may already have the licenses table,
   * so add the hash column separately as a migration.
   */
  await pool.query(`
    ALTER TABLE licenses
    ADD COLUMN IF NOT EXISTS license_key_hash TEXT
  `);

  await pool.query(`
    ALTER TABLE licenses
    ADD COLUMN IF NOT EXISTS license_key_hint TEXT
  `);

  /*
   * Legacy licenses may still contain plaintext license_key values.
   * New licenses are stored hash-only, so license_key must be nullable.
   */
  await pool.query(`
    ALTER TABLE licenses
    ALTER COLUMN license_key DROP NOT NULL
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
   * ---------------------------------------------------------
   * LICENSE KEY MIGRATION
   * ---------------------------------------------------------
   *
   * Backfill hashes for existing plaintext license keys.
   * The plaintext column remains temporarily for backwards-
   * compatible administration while activation lookup moves
   * entirely to license_key_hash.
   */
  const legacyLicenses =
    await pool.query<{
      id: string;
      license_key: string;
    }>(
      `
        SELECT
          id,
          license_key
        FROM licenses
        WHERE
          license_key_hash IS NULL
          OR license_key_hash = ''
      `,
    );

  for (
    const license
    of legacyLicenses.rows
  ) {
    await pool.query(
      `
        UPDATE licenses
        SET license_key_hash = $1
        WHERE id = $2
      `,
      [
        hashLicenseKey(
          license.license_key,
        ),
        license.id,
      ],
    );
  }

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_license_key_hash
    ON licenses (license_key_hash)
  `);

  /*
   * ---------------------------------------------------------
   * ACTIVATION TOKEN MIGRATION
   * ---------------------------------------------------------
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
