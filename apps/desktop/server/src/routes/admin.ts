import type {
  FastifyInstance,
} from "fastify";

import {
  requireAdmin,
} from "../adminAuth.js";

import {
  createLicense,
  getLicenseById,
  listLicenses,
  revokeLicense,
} from "../licenseAdmin.js";

import type {
  LicensePlan,
} from "../licenseKey.js";

const VALID_PLANS: LicensePlan[] = [
  "free",
  "pro",
  "business",
];

function validLicenseId(
  id: string | undefined,
): id is string {
  return Boolean(
    id &&
    /^[1-9]\d*$/.test(
      id,
    ),
  );
}

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

  app.get(
    "/v1/admin/licenses",
    {
      preHandler:
        requireAdmin,
    },
    async () => {
      const licenses =
        await listLicenses();

      return {
        success: true,
        licenses,
      };
    },
  );

  app.get(
    "/v1/admin/licenses/:id",
    {
      preHandler:
        requireAdmin,
    },
    async (
      request,
      reply,
    ) => {
      const params =
        request.params as {
          id?: string;
        };

      if (
        !validLicenseId(
          params.id,
        )
      ) {
        return reply
          .code(400)
          .send({
            success: false,
            message:
              "License id must be a positive integer.",
          });
      }

      const license =
        await getLicenseById(
          params.id,
        );

      if (!license) {
        return reply
          .code(404)
          .send({
            success: false,
            message:
              "License not found.",
          });
      }

      return {
        success: true,
        license,
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

  app.post(
    "/v1/admin/licenses/:id/revoke",
    {
      preHandler:
        requireAdmin,
    },
    async (
      request,
      reply,
    ) => {
      const params =
        request.params as {
          id?: string;
        };

      if (
        !validLicenseId(
          params.id,
        )
      ) {
        return reply
          .code(400)
          .send({
            success: false,
            message:
              "License id must be a positive integer.",
          });
      }

      const license =
        await revokeLicense(
          params.id,
        );

      if (!license) {
        return reply
          .code(404)
          .send({
            success: false,
            message:
              "License not found.",
          });
      }

      return {
        success: true,
        license,
      };
    },
  );
}
