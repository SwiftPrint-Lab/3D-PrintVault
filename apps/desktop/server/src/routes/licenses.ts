import type {
  FastifyInstance,
} from "fastify";

import crypto from "node:crypto";

import {
  pool,
} from "../db.js";

type LicenseRow = {
  id: string;
  license_key: string;
  product: string;
  plan: string;
  status: string;
  max_activations: number;
};

type ActivationRow = {
  id: string;
  license_id: string;
  device_id: string;
  activation_token: string;
  activated_at: string;
  last_validated_at: string | null;
  deactivated_at: string | null;
};

function createActivationToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function bearerToken(
  authorization:
    string | undefined,
) {
  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  return authorization
    .slice(
      "Bearer ".length,
    )
    .trim();
}

export async function registerLicenseRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/v1/licenses/activate",
    async (
      request,
      reply,
    ) => {
      const body =
        request.body as {
          licenseKey?: string;
          deviceId?: string;
          installationId?: string;
          product?: string;
        };

      const licenseKey =
        body.licenseKey
          ?.trim();

      const deviceId =
        (
          body.deviceId ??
          body.installationId
        )?.trim();

      const product =
        body.product
          ?.trim();

      if (
        !licenseKey ||
        !deviceId ||
        !product
      ) {
        return reply
          .code(400)
          .send({
            success: false,
            message:
              "licenseKey, deviceId, and product are required.",
          });
      }

      const client =
        await pool.connect();

      try {
        await client.query(
          "BEGIN",
        );

        const licenseResult =
          await client.query<LicenseRow>(
            `
              SELECT
                id,
                license_key,
                product,
                plan,
                status,
                max_activations
              FROM licenses
              WHERE license_key = $1
              LIMIT 1
            `,
            [
              licenseKey,
            ],
          );

        const license =
          licenseResult.rows[0];

        if (!license) {
          await client.query(
            "ROLLBACK",
          );

          return reply
            .code(404)
            .send({
              success: false,
              message:
                "License key not found.",
            });
        }

        if (
          license.product !==
          product
        ) {
          await client.query(
            "ROLLBACK",
          );

          return reply
            .code(403)
            .send({
              success: false,
              message:
                "License is not valid for this product.",
            });
        }

        if (
          license.status !==
          "active"
        ) {
          await client.query(
            "ROLLBACK",
          );

          return reply
            .code(403)
            .send({
              success: false,
              message:
                "License is not active.",
            });
        }

        const existingResult =
          await client.query<ActivationRow>(
            `
              SELECT
                id,
                license_id,
                device_id,
                activation_token,
                activated_at,
                last_validated_at,
                deactivated_at
              FROM activations
              WHERE
                license_id = $1
                AND device_id = $2
              LIMIT 1
            `,
            [
              license.id,
              deviceId,
            ],
          );

        const existing =
          existingResult.rows[0];

        if (
          existing &&
          !existing.deactivated_at
        ) {
          await client.query(
            "COMMIT",
          );

          return {
            success: true,
            plan:
              license.plan,
            activationToken:
              existing.activation_token,
            activatedAt:
              existing.activated_at,
          };
        }

        const activeCountResult =
          await client.query<{
            count: string;
          }>(
            `
              SELECT
                COUNT(*)::text AS count
              FROM activations
              WHERE
                license_id = $1
                AND deactivated_at IS NULL
            `,
            [
              license.id,
            ],
          );

        const activeCount =
          Number(
            activeCountResult
              .rows[0]
              .count,
          );

        if (
          activeCount >=
          license.max_activations
        ) {
          await client.query(
            "ROLLBACK",
          );

          return reply
            .code(409)
            .send({
              success: false,
              message:
                "Maximum activations reached for this license.",
            });
        }

        const token =
          createActivationToken();

        let activationResult;

        if (existing) {
          activationResult =
            await client.query<ActivationRow>(
              `
                UPDATE activations
                SET
                  activation_token = $1,
                  activated_at = NOW(),
                  last_validated_at = NULL,
                  deactivated_at = NULL
                WHERE id = $2
                RETURNING
                  id,
                  license_id,
                  device_id,
                  activation_token,
                  activated_at,
                  last_validated_at,
                  deactivated_at
              `,
              [
                token,
                existing.id,
              ],
            );
        } else {
          activationResult =
            await client.query<ActivationRow>(
              `
                INSERT INTO activations (
                  license_id,
                  device_id,
                  activation_token
                )
                VALUES (
                  $1,
                  $2,
                  $3
                )
                RETURNING
                  id,
                  license_id,
                  device_id,
                  activation_token,
                  activated_at,
                  last_validated_at,
                  deactivated_at
              `,
              [
                license.id,
                deviceId,
                token,
              ],
            );
        }

        await client.query(
          "COMMIT",
        );

        const activation =
          activationResult
            .rows[0];

        return {
          success: true,
          plan:
            license.plan,
          activationToken:
            activation.activation_token,
          activatedAt:
            activation.activated_at,
        };
      } catch (error) {
        await client.query(
          "ROLLBACK",
        );

        throw error;
      } finally {
        client.release();
      }
    },
  );

  app.post(
    "/v1/licenses/validate",
    async (
      request,
      reply,
    ) => {
      const token =
        bearerToken(
          request.headers
            .authorization,
        );

      const body =
        request.body as {
          deviceId?: string;
          installationId?: string;
          product?: string;
        };

      const deviceId =
        (
          body.deviceId ??
          body.installationId
        )?.trim();

      const product =
        body.product
          ?.trim();

      if (
        !token ||
        !deviceId ||
        !product
      ) {
        return reply
          .code(400)
          .send({
            valid: false,
            message:
              "Authorization token, deviceId, and product are required.",
          });
      }

      const result =
        await pool.query<
          ActivationRow &
          LicenseRow
        >(
          `
            SELECT
              a.id,
              a.license_id,
              a.device_id,
              a.activation_token,
              a.activated_at,
              a.last_validated_at,
              a.deactivated_at,
              l.license_key,
              l.product,
              l.plan,
              l.status,
              l.max_activations
            FROM activations a
            INNER JOIN licenses l
              ON l.id = a.license_id
            WHERE
              a.activation_token = $1
              AND a.device_id = $2
            LIMIT 1
          `,
          [
            token,
            deviceId,
          ],
        );

      const activation =
        result.rows[0];

      if (
        !activation ||
        activation.deactivated_at ||
        activation.status !==
          "active" ||
        activation.product !==
          product
      ) {
        return reply
          .code(401)
          .send({
            valid: false,
            message:
              "License activation is not valid.",
          });
      }

      await pool.query(
        `
          UPDATE activations
          SET last_validated_at = NOW()
          WHERE id = $1
        `,
        [
          activation.id,
        ],
      );

      return {
        valid: true,
        plan:
          activation.plan,
      };
    },
  );

  app.post(
    "/v1/licenses/deactivate",
    async (
      request,
      reply,
    ) => {
      const token =
        bearerToken(
          request.headers
            .authorization,
        );

      const body =
        request.body as {
          deviceId?: string;
          installationId?: string;
          product?: string;
        };

      const deviceId =
        (
          body.deviceId ??
          body.installationId
        )?.trim();

      const product =
        body.product
          ?.trim();

      if (
        !token ||
        !deviceId ||
        !product
      ) {
        return reply
          .code(400)
          .send({
            success: false,
            message:
              "Authorization token, deviceId, and product are required.",
          });
      }

      const result =
        await pool.query(
          `
            UPDATE activations a
            SET deactivated_at = NOW()
            FROM licenses l
            WHERE
              a.license_id = l.id
              AND a.activation_token = $1
              AND a.device_id = $2
              AND l.product = $3
              AND a.deactivated_at IS NULL
            RETURNING a.id
          `,
          [
            token,
            deviceId,
            product,
          ],
        );

      if (
        result.rowCount ===
        0
      ) {
        return reply
          .code(404)
          .send({
            success: false,
            message:
              "Active license activation not found.",
          });
      }

      return {
        success: true,
      };
    },
  );
}
