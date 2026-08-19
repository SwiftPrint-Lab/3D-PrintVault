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
