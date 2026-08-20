import {
  pool,
} from "./db.js";

import {
  generateLicenseKey,
  hashLicenseKey,
  type LicensePlan,
} from "./licenseKey.js";

export type CreateLicenseInput = {
  plan: LicensePlan;
  product?: string;
  maxActivations?: number;
};

export type CreatedLicense = {
  id: string;
  licenseKey: string;
  product: string;
  plan: LicensePlan;
  status: string;
  maxActivations: number;
};

export type AdminLicense = {
  id: string;
  licenseKeyHint: string | null;
  product: string;
  plan: LicensePlan;
  status: string;
  maxActivations: number;
  activeActivations: number;
  createdAt: string;
  updatedAt: string;
};

function licenseKeyHint(
  licenseKey: string,
): string {
  return licenseKey.slice(-5);
}

export async function createLicense(
  input: CreateLicenseInput,
): Promise<CreatedLicense> {
  const product =
    input.product ??
    "3d-printvault";

  const maxActivations =
    input.maxActivations ??
    1;

  if (
    !Number.isInteger(
      maxActivations,
    ) ||
    maxActivations < 1
  ) {
    throw new Error(
      "maxActivations must be a positive integer.",
    );
  }

  /*
   * Collision probability is already extremely small,
   * but retry a few times if the unique hash constraint
   * reports a collision.
   */
  for (
    let attempt = 0;
    attempt < 5;
    attempt += 1
  ) {
    const licenseKey =
      generateLicenseKey(
        input.plan,
      );

    const licenseKeyHash =
      hashLicenseKey(
        licenseKey,
      );

    const hint =
      licenseKeyHint(
        licenseKey,
      );

    try {
      const result =
        await pool.query<{
          id: string;
          product: string;
          plan: LicensePlan;
          status: string;
          max_activations: number;
        }>(
          `
            INSERT INTO licenses (
              license_key,
              license_key_hash,
              license_key_hint,
              product,
              plan,
              status,
              max_activations
            )
            VALUES (
              NULL,
              $1,
              $2,
              $3,
              $4,
              'active',
              $5
            )
            RETURNING
              id,
              product,
              plan,
              status,
              max_activations
          `,
          [
            licenseKeyHash,
            hint,
            product,
            input.plan,
            maxActivations,
          ],
        );

      const row =
        result.rows[0];

      return {
        id:
          row.id,
        licenseKey,
        product:
          row.product,
        plan:
          row.plan,
        status:
          row.status,
        maxActivations:
          row.max_activations,
      };
    } catch (error) {
      const postgresError =
        error as {
          code?: string;
          constraint?: string;
        };

      if (
        postgresError.code ===
          "23505" &&
        postgresError.constraint?.includes(
          "license_key_hash",
        )
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "Could not generate a unique license key after multiple attempts.",
  );
}

type AdminLicenseRow = {
  id: string;
  license_key_hint: string | null;
  product: string;
  plan: LicensePlan;
  status: string;
  max_activations: number;
  active_activations: string;
  created_at: string;
  updated_at: string;
};

function mapAdminLicense(
  row: AdminLicenseRow,
): AdminLicense {
  return {
    id:
      row.id,
    licenseKeyHint:
      row.license_key_hint,
    product:
      row.product,
    plan:
      row.plan,
    status:
      row.status,
    maxActivations:
      row.max_activations,
    activeActivations:
      Number(
        row.active_activations,
      ),
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}

export async function listLicenses():
  Promise<AdminLicense[]> {
  const result =
    await pool.query<AdminLicenseRow>(
      `
        SELECT
          l.id,
          l.license_key_hint,
          l.product,
          l.plan,
          l.status,
          l.max_activations,
          COUNT(a.id)
            FILTER (
              WHERE
                a.deactivated_at IS NULL
            )::text
            AS active_activations,
          l.created_at,
          l.updated_at
        FROM licenses l
        LEFT JOIN activations a
          ON a.license_id = l.id
        GROUP BY
          l.id,
          l.license_key_hint,
          l.product,
          l.plan,
          l.status,
          l.max_activations,
          l.created_at,
          l.updated_at
        ORDER BY
          l.id DESC
      `,
    );

  return result.rows.map(
    mapAdminLicense,
  );
}

export async function getLicenseById(
  id: string,
): Promise<AdminLicense | null> {
  const result =
    await pool.query<AdminLicenseRow>(
      `
        SELECT
          l.id,
          l.license_key_hint,
          l.product,
          l.plan,
          l.status,
          l.max_activations,
          COUNT(a.id)
            FILTER (
              WHERE
                a.deactivated_at IS NULL
            )::text
            AS active_activations,
          l.created_at,
          l.updated_at
        FROM licenses l
        LEFT JOIN activations a
          ON a.license_id = l.id
        WHERE l.id = $1
        GROUP BY
          l.id,
          l.license_key_hint,
          l.product,
          l.plan,
          l.status,
          l.max_activations,
          l.created_at,
          l.updated_at
        LIMIT 1
      `,
      [
        id,
      ],
    );

  const row =
    result.rows[0];

  if (!row) {
    return null;
  }

  return mapAdminLicense(
    row,
  );
}

export async function revokeLicense(
  id: string,
): Promise<AdminLicense | null> {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN",
    );

    const result =
      await client.query<{
        id: string;
      }>(
        `
          UPDATE licenses
          SET
            status = 'revoked',
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [
          id,
        ],
      );

    if (
      result.rowCount === 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return null;
    }

    await client.query(
      `
        UPDATE activations
        SET deactivated_at = NOW()
        WHERE
          license_id = $1
          AND deactivated_at IS NULL
      `,
      [
        id,
      ],
    );

    await client.query(
      "COMMIT",
    );
  } catch (error) {
    await client.query(
      "ROLLBACK",
    );

    throw error;
  } finally {
    client.release();
  }

  return getLicenseById(
    id,
  );
}
