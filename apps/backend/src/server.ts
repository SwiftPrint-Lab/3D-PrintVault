import Fastify
    from "fastify";

import cors
    from "@fastify/cors";

import {
    config,
} from "./config.js";

import "./database.js";

import {
    healthRoutes,
} from "./routes/health.js";

import {
    licenseRoutes,
} from "./routes/licenses.js";

const app =
    Fastify({
        logger:
            true,
    });

await app.register(
    cors,
    {
        origin:
            (config as { corsOrigin?: string }).corsOrigin,
    },
);

await app.register(
    healthRoutes,
);

await app.register(
    licenseRoutes,
);

try {
    const address =
        await app.listen({
            host:
                config.host,

            port:
                config.port,
        });

    app.log.info(
        `3D PrintVault licensing API listening at ${address}`,
    );
} catch (error) {
    app.log.error(
        error,
    );

    process.exit(
        1,
    );
}