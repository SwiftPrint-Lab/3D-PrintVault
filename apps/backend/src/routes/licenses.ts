import type {
    FastifyInstance,
} from "fastify";

import {
    activateLicense,
    deactivateActivation,
    validateActivation,
} from "../services/licenseService.js";

interface ActivationBody {
    licenseKey: string;
    deviceId: string;
    deviceName?: string;
    product: string;
}

interface ValidationBody {
    deviceId: string;
    product: string;
}

function getBearerToken(
    authorization:
        string |
        string[] |
        undefined,
): string | null {
    if (
        typeof authorization !==
        "string"
    ) {
        return null;
    }

    const [
        type,
        token,
    ] =
        authorization.split(
            " ",
            2,
        );

    if (
        type !== "Bearer" ||
        !token
    ) {
        return null;
    }

    return token;
}

function validateProduct(
    product: string,
) {
    if (
        product !==
        "3d-printvault"
    ) {
        throw new Error(
            "Unsupported product.",
        );
    }
}

export async function licenseRoutes(
    app: FastifyInstance,
) {
    app.post<{
        Body: ActivationBody;
    }>(
        "/v1/licenses/activate",
        async (
            request,
            reply,
        ) => {
            try {
                const {
                    licenseKey,
                    deviceId,
                    deviceName,
                    product,
                } =
                    request.body;

                validateProduct(
                    product,
                );

                if (
                    !licenseKey?.trim() ||
                    !deviceId?.trim()
                ) {
                    return reply
                        .code(
                            400,
                        )
                        .send({
                            success:
                                false,

                            message:
                                "License key and device ID are required.",
                        });
                }

                const result =
                    activateLicense(
                        licenseKey,
                        deviceId,
                        deviceName,
                    );

                return {
                    success:
                        true,

                    plan:
                        result
                            .license
                            .plan,

                    status:
                        result
                            .license
                            .status,

                    expiresAt:
                        result
                            .license
                            .expires_at,

                    maxDevices:
                        result
                            .license
                            .max_devices,

                    activatedAt:
                        result
                            .activatedAt,

                    activationToken:
                        result
                            .token,
                };
            } catch (error) {
                return reply
                    .code(
                        400,
                    )
                    .send({
                        success:
                            false,

                        message:
                            error instanceof Error
                                ? error.message
                                : String(
                                    error,
                                ),
                    });
            }
        },
    );

    app.post<{
        Body: ValidationBody;
    }>(
        "/v1/licenses/validate",
        async (
            request,
            reply,
        ) => {
            try {
                validateProduct(
                    request.body
                        .product,
                );

                const token =
                    getBearerToken(
                        request.headers
                            .authorization,
                    );

                if (!token) {
                    return reply
                        .code(
                            401,
                        )
                        .send({
                            valid:
                                false,

                            message:
                                "Activation token is required.",
                        });
                }

                const result =
                    validateActivation(
                        token,
                        request.body
                            .deviceId,
                    );

                if (
                    !result.valid
                ) {
                    return reply
                        .code(
                            401,
                        )
                        .send(
                            result,
                        );
                }

                return result;
            } catch (error) {
                return reply
                    .code(
                        400,
                    )
                    .send({
                        valid:
                            false,

                        message:
                            error instanceof Error
                                ? error.message
                                : String(
                                    error,
                                ),
                    });
            }
        },
    );

    app.post<{
        Body: ValidationBody;
    }>(
        "/v1/licenses/deactivate",
        async (
            request,
            reply,
        ) => {
            try {
                validateProduct(
                    request.body
                        .product,
                );

                const token =
                    getBearerToken(
                        request.headers
                            .authorization,
                    );

                if (!token) {
                    return reply
                        .code(
                            401,
                        )
                        .send({
                            success:
                                false,

                            message:
                                "Activation token is required.",
                        });
                }

                deactivateActivation(
                    token,
                    request.body
                        .deviceId,
                );

                return {
                    success:
                        true,
                };
            } catch (error) {
                return reply
                    .code(
                        400,
                    )
                    .send({
                        success:
                            false,

                        message:
                            error instanceof Error
                                ? error.message
                                : String(
                                    error,
                                ),
                    });
            }
        },
    );
}