import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import {
  checkDatabaseConnection,
  pool,
} from "./db.js";

import {
  initializeSchema,
} from "./schema.js";

import {
  registerLicenseRoutes,
} from "./routes/licenses.js";

import {
  registerAdminRoutes,
} from "./routes/admin.js";

const app =
  Fastify({
    logger: true,
  });

await app.register(
  cors,
  {
    origin: true,
  },
);

await registerLicenseRoutes(
  app,
);

await registerAdminRoutes(
  app,
);

app.get(
  "/health",
  async () => {
    const database =
      await checkDatabaseConnection();

    return {
      status: "ok",
      service:
        "3d-printvault-license-api",
      database: "connected",
      databaseTime:
        database.now,
    };
  },
);

async function start() {
  try {
    await initializeSchema();

    const port =
      Number(
        process.env.PORT ??
        8787,
      );

    await app.listen({
      port,
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(
      error,
    );

    await pool.end();

    process.exit(1);
  }
}

async function shutdown() {
  await app.close();
  await pool.end();
}

process.on(
  "SIGTERM",
  shutdown,
);

process.on(
  "SIGINT",
  shutdown,
);

await start();
