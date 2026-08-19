import type {
  FastifyInstance,
} from "fastify";

import {
  requireAdmin,
} from "../adminAuth.js";

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
}
