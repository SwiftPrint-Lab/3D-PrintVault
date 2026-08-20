import type {
  FastifyInstance,
} from "fastify";

import {
  requireAdmin,
} from "../adminAuth.js";

import {
  createLicense,
} from "../licenseAdmin.js";

import type {
  LicensePlan,
} from "../licenseKey.js";

const VALID_PLANS: LicensePlan[] = [
  "free",
  "pro",
  "business",
];

export async function registerAdminRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/v1/admin/ping",
    {
      preHandler:
        requireAdmin,
    },
    async () => {
      return {
        success: true,
        service:
          "3d-printvault-admin",
        authenticated: true,
      };
    },
  );

  app.post(
    "/v1/admin/licenses",
    {
      preHandler:
        requireAdmin,
    },
    async (
      request,
      reply,
    ) => {
      const body =
        request.body as {
          plan?: string;
          product?: string;
          maxActivations?: number;
        };

      const plan =
        body.plan
          ?.trim()
          .toLowerCase() as
          | LicensePlan
          | undefined;

      const product =
        body.product
          ?.trim() ||
        "3d-printvault";

      const maxActivations =
        body.maxActivations ??
        1;

      if (
        !plan ||
        !VALID_PLANS.includes(
          plan,
        )
      ) {
        return reply
          .code(400)
          .send({
            success: false,
            message:
              "plan must be one of: free, pro, business.",
          });
      }

      if (
        !Number.isInteger(
          maxActivations,
        ) ||
        maxActivations < 1
      ) {
        return reply
          .code(400)
          .send({
            success: false,
            message:
              "maxActivations must be a positive integer.",
          });
      }

      const license =
        await createLicense({
          plan,
          product,
          maxActivations,
        });

      return reply
        .code(201)
        .send({
          success: true,
          license: {
            id:
              license.id,
            licenseKey:
              license.licenseKey,
            product:
              license.product,
            plan:
              license.plan,
            status:
              license.status,
            maxActivations:
              license.maxActivations,
          },
        });
    },
  );
}
