import type {
    FastifyInstance,
} from "fastify";

export async function healthRoutes(
    app: FastifyInstance,
) {
    app.get(
        "/health",
        async () => {
            return {
                ok: true,
                service: "3d-printvault-licensing",
                timestamp: new Date().toISOString(),
            };
        },
    );
}