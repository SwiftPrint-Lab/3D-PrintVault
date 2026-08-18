export type LicenseStatus =
    | "trial"
    | "activated"
    | "expired"
    | "invalid"
    | "deactivated";

export type LicenseEdition =
    | "Trial"
    | "Personal"
    | "Pro";

export type LicensePlan =
    | "free"
    | "pro"
    | "business";

export type PremiumFeature =
    | "calculator.materialIntegration"
    | "calculator.machineIntegration"
    | "calculator.advanced"
    | "dualPane"
    | "advancedAutomation";

export interface LicenseEntitlements {
    premiumFeatures:
    PremiumFeature[];
}

export interface LicenseState {
    status:
    LicenseStatus;

    edition:
    LicenseEdition;

    installationId:
    string;

    trialStartedAt:
    string;

    trialExpiresAt:
    string;

    activatedAt?:
    string;

    lastValidatedAt?:
    string;

    licenseKeyMasked?:
    string;

    entitlementToken?:
    string;

    entitlements:
    LicenseEntitlements;
}

/*
 * ---------------------------------------------------------
 * BACKEND ACTIVATION RESPONSE
 * ---------------------------------------------------------
 */

export interface LicenseActivationResponse {
    success:
    boolean;

    message?:
    string;

    plan?:
    LicensePlan;

    status?:
    "active"
    | "inactive"
    | "expired"
    | "revoked";

    expiresAt?:
    string |
    null;

    maxDevices?:
    number;

    activatedAt?:
    string;

    activationToken?:
    string;
}

/*
 * ---------------------------------------------------------
 * BACKEND VALIDATION RESPONSE
 * ---------------------------------------------------------
 */

export interface LicenseValidationResponse {
    valid:
    boolean;

    message?:
    string;

    plan?:
    LicensePlan;

    expiresAt?:
    string |
    null;

    maxDevices?:
    number;

    lastValidatedAt?:
    string;
}