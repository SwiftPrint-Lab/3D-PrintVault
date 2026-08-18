import {
    createHmac,
    randomBytes,
} from "node:crypto";

import {
    config,
} from "../config.js";

export function normalizeLicenseKey(
    licenseKey: string,
): string {
    return licenseKey
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            "",
        );
}

export function hashLicenseKey(
    licenseKey: string,
): string {
    return createHmac(
        "sha256",
        config.licenseSigningSecret,
    )
        .update(
            normalizeLicenseKey(
                licenseKey,
            ),
        )
        .digest(
            "hex",
        );
}

export function createActivationToken():
    string {
    return randomBytes(
        32,
    ).toString(
        "base64url",
    );
}

export function hashActivationToken(
    token: string,
): string {
    return createHmac(
        "sha256",
        config.licenseSigningSecret,
    )
        .update(
            token,
        )
        .digest(
            "hex",
        );
}

export function createLicenseKey():
    string {
    const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    const segments:
        string[] = [];

    for (
        let segmentIndex =
            0;
        segmentIndex <
        4;
        segmentIndex +=
        1
    ) {
        let segment =
            "";

        const random =
            randomBytes(
                5,
            );

        for (
            const byte
            of random
        ) {
            segment +=
                alphabet[
                byte %
                alphabet.length
                ];
        }

        segments.push(
            segment,
        );
    }

    return `PV-${segments.join(
        "-",
    )}`;
}