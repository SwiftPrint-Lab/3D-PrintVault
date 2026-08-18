import {
    database,
} from "../database.js";

import {
    createActivationToken,
    hashActivationToken,
    hashLicenseKey,
} from "../licensing/licenseCrypto.js";

import type {
    LicensePlan,
} from "../licensing/licenseTypes.js";

interface LicenseRow {
    id:
    number;

    key_hash:
    string;

    email:
    string;

    plan:
    LicensePlan;

    status:
    "active" |
    "inactive" |
    "expired" |
    "revoked";

    max_devices:
    number;

    expires_at:
    string | null;

    created_at:
    string;

    updated_at:
    string;
}

interface ActivationRow {
    id:
    number;

    license_id:
    number;

    device_id:
    string;

    device_name:
    string | null;

    token_hash:
    string;

    activated_at:
    string;

    last_validated_at:
    string;

    deactivated_at:
    string | null;
}

function isLicenseExpired(
    license:
        LicenseRow,
): boolean {
    if (
        !license.expires_at
    ) {
        return false;
    }

    return (
        Date.now() >
        new Date(
            license.expires_at,
        ).getTime()
    );
}

export function activateLicense(
    licenseKey:
        string,

    deviceId:
        string,

    deviceName?:
        string,
) {
    const keyHash =
        hashLicenseKey(
            licenseKey,
        );

    const license =
        database.prepare(
            `
            SELECT
                *
            FROM licenses
            WHERE key_hash = ?
            LIMIT 1
            `,
        ).get(
            keyHash,
        ) as
        LicenseRow |
        undefined;

    if (!license) {
        throw new Error(
            "License key was not found.",
        );
    }

    if (
        license.status !==
        "active"
    ) {
        throw new Error(
            `License is ${license.status}.`,
        );
    }

    if (
        isLicenseExpired(
            license,
        )
    ) {
        throw new Error(
            "License has expired.",
        );
    }

    const existingActivation =
        database.prepare(
            `
            SELECT
                *
            FROM activations
            WHERE
                license_id = ?
                AND device_id = ?
                AND deactivated_at IS NULL
            LIMIT 1
            `,
        ).get(
            license.id,
            deviceId,
        ) as
        ActivationRow |
        undefined;

    const now =
        new Date()
            .toISOString();

    if (
        existingActivation
    ) {
        const token =
            createActivationToken();

        const tokenHash =
            hashActivationToken(
                token,
            );

        database.prepare(
            `
            UPDATE activations
            SET
                token_hash = ?,
                device_name = ?,
                last_validated_at = ?
            WHERE id = ?
            `,
        ).run(
            tokenHash,
            deviceName ??
            existingActivation
                .device_name,
            now,
            existingActivation.id,
        );

        return {
            token,
            license,
            activatedAt:
                existingActivation
                    .activated_at,
        };
    }

    const activeDevices =
        database.prepare(
            `
            SELECT
                COUNT(*) AS count
            FROM activations
            WHERE
                license_id = ?
                AND deactivated_at IS NULL
            `,
        ).get(
            license.id,
        ) as {
            count:
            number;
        };

    if (
        Number(
            activeDevices.count,
        ) >=
        license.max_devices
    ) {
        throw new Error(
            "This license has reached its device activation limit.",
        );
    }

    const token =
        createActivationToken();

    const tokenHash =
        hashActivationToken(
            token,
        );

    database.prepare(
        `
        INSERT INTO activations (
            license_id,
            device_id,
            device_name,
            token_hash,
            activated_at,
            last_validated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
    ).run(
        license.id,
        deviceId,
        deviceName ??
        null,
        tokenHash,
        now,
        now,
    );

    return {
        token,
        license,
        activatedAt:
            now,
    };
}

export function validateActivation(
    token:
        string,

    deviceId:
        string,
) {
    const tokenHash =
        hashActivationToken(
            token,
        );

    const row =
        database.prepare(
            `
            SELECT
                activations.id AS activation_id,
                activations.device_id,
                activations.deactivated_at,

                licenses.id AS license_id,
                licenses.plan,
                licenses.status,
                licenses.expires_at,
                licenses.max_devices

            FROM activations

            INNER JOIN licenses
                ON licenses.id =
                   activations.license_id

            WHERE
                activations.token_hash = ?

            LIMIT 1
            `,
        ).get(
            tokenHash,
        ) as
        {
            activation_id:
            number;

            device_id:
            string;

            deactivated_at:
            string | null;

            license_id:
            number;

            plan:
            LicensePlan;

            status:
            "active" |
            "inactive" |
            "expired" |
            "revoked";

            expires_at:
            string | null;

            max_devices:
            number;
        } |
        undefined;

    if (!row) {
        return {
            valid:
                false,

            message:
                "Activation token was not found.",
        };
    }

    if (
        row.device_id !==
        deviceId
    ) {
        return {
            valid:
                false,

            message:
                "This activation belongs to another device.",
        };
    }

    if (
        row.deactivated_at
    ) {
        return {
            valid:
                false,

            message:
                "This activation has been deactivated.",
        };
    }

    if (
        row.status !==
        "active"
    ) {
        return {
            valid:
                false,

            message:
                `License is ${row.status}.`,
        };
    }

    if (
        row.expires_at &&
        Date.now() >
        new Date(
            row.expires_at,
        ).getTime()
    ) {
        return {
            valid:
                false,

            message:
                "License has expired.",
        };
    }

    const now =
        new Date()
            .toISOString();

    database.prepare(
        `
        UPDATE activations
        SET
            last_validated_at = ?
        WHERE id = ?
        `,
    ).run(
        now,
        row.activation_id,
    );

    return {
        valid:
            true,

        message:
            "License is valid.",

        plan:
            row.plan,

        expiresAt:
            row.expires_at,

        maxDevices:
            row.max_devices,

        lastValidatedAt:
            now,
    };
}

export function deactivateActivation(
    token:
        string,

    deviceId:
        string,
): void {
    const tokenHash =
        hashActivationToken(
            token,
        );

    const activation =
        database.prepare(
            `
            SELECT
                id,
                device_id,
                deactivated_at
            FROM activations
            WHERE token_hash = ?
            LIMIT 1
            `,
        ).get(
            tokenHash,
        ) as
        {
            id:
            number;

            device_id:
            string;

            deactivated_at:
            string | null;
        } |
        undefined;

    if (!activation) {
        return;
    }

    if (
        activation.device_id !==
        deviceId
    ) {
        throw new Error(
            "Activation belongs to another device.",
        );
    }

    if (
        activation.deactivated_at
    ) {
        return;
    }

    database.prepare(
        `
        UPDATE activations
        SET
            deactivated_at = ?
        WHERE id = ?
        `,
    ).run(
        new Date()
            .toISOString(),
        activation.id,
    );
}