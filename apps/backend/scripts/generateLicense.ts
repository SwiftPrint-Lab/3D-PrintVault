import {
    database,
} from "../src/database.js";

import {
    createLicenseKey,
    hashLicenseKey,
} from "../src/licensing/licenseCrypto.js";

import type {
    LicensePlan,
} from "../src/licensing/licenseTypes.js";

function readPlan():
    LicensePlan {
    const argument =
        process.argv[2]
            ?.trim()
            .toLowerCase();

    if (
        argument ===
        "business"
    ) {
        return "business";
    }

    if (
        argument ===
        "pro"
    ) {
        return "pro";
    }

    return "free";
}

const plan =
    readPlan();

const maxDevices =
    Number(
        process.argv[3] ??
        "1",
    );

const email =
    process.argv[4]
        ?.trim() ??
    "test@swiftprintlab.com";

if (
    !Number.isInteger(
        maxDevices,
    ) ||
    maxDevices <
    1
) {
    throw new Error(
        "Device limit must be a positive integer.",
    );
}

const licenseKey =
    createLicenseKey();

const keyHash =
    hashLicenseKey(
        licenseKey,
    );

const now =
    new Date()
        .toISOString();

database.prepare(
    `
    INSERT INTO licenses (
        key_hash,
        email,
        plan,
        status,
        max_devices,
        expires_at,
        created_at,
        updated_at
    )
    VALUES (?, ?, ?, 'active', ?, NULL, ?, ?)
    `,
).run(
    keyHash,
    email,
    plan,
    maxDevices,
    now,
    now,
);

console.log("");
console.log(
    "3D PrintVault license created",
);

console.log(
    "-----------------------------",
);

console.log(
    `Plan: ${plan}`,
);

console.log(
    `Email: ${email}`,
);

console.log(
    `Max Devices: ${maxDevices}`,
);

console.log(
    `License Key: ${licenseKey}`,
);

console.log("");
console.log(
    "Save this key now. The database stores only the hashed form.",
);
console.log("");