import {
    getLicenseState,
} from "./licenseService";

import type {
    PremiumFeature,
} from "./types";

export function canUsePremiumFeature(
    feature:
        PremiumFeature,
): boolean {
    const license =
        getLicenseState();

    if (
        license.status !==
        "activated"
    ) {
        return false;
    }

    return license.entitlements
        .premiumFeatures
        .includes(
            feature,
        );
}

export function hasPaidLicense():
    boolean {
    return (
        getLicenseState()
            .status ===
        "activated"
    );
}

export function isTrialActive():
    boolean {
    return (
        getLicenseState()
            .status ===
        "trial"
    );
}