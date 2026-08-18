import "dotenv/config";

function requireEnvironmentVariable(
    name: string,
): string {
    const value =
        process.env[name]
            ?.trim();

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}`,
        );
    }

    return value;
}

export const config = {
    host:
        process.env.HOST ??
        "127.0.0.1",

    port:
        Number(
            process.env.PORT ??
            "8787",
        ),

    databasePath:
        process.env
            .LICENSE_DATABASE_PATH ??
        "./data/printvault-licensing.db",

    licenseSigningSecret:
        requireEnvironmentVariable(
            "LICENSE_SIGNING_SECRET",
        ),

    corsOrigin:
        process.env.CORS_ORIGIN ??
        "http://localhost:1420",
};