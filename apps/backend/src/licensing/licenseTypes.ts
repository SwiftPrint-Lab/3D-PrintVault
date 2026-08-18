export type LicensePlan =
    | "free"
    | "pro"
    | "business";

export type LicenseStatus =
    | "active"
    | "inactive"
    | "expired"
    | "revoked";

export interface LicenseRecord {
    id: number;

    licenseKey: string;

    email: string;

    plan: LicensePlan;

    status: LicenseStatus;

    maxDevices: number;

    expiresAt: string | null;

    createdAt: string;

    updatedAt: string;
}

export interface LicenseActivationRequest {
    licenseKey: string;

    deviceId: string;

    deviceName?: string;
}

export interface LicenseActivationResponse {
    valid: boolean;

    message: string;

    activationToken?: string;

    license?: {
        plan: LicensePlan;

        status: LicenseStatus;

        expiresAt: string | null;

        maxDevices: number;
    };
}

export interface LicenseValidationRequest {
    activationToken: string;

    deviceId: string;
}

export interface LicenseValidationResponse {
    valid: boolean;

    message: string;

    license?: {
        plan: LicensePlan;

        status: LicenseStatus;

        expiresAt: string | null;
    };
}