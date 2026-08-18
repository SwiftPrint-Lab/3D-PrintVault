import type {
    LicenseActivationResponse,
    LicenseEdition,
    LicenseEntitlements,
    LicenseState,
    LicenseValidationResponse,
} from "./types";

const LICENSE_STORAGE_KEY =
    "printvault.licenseState";

const TRIAL_LENGTH_DAYS =
    14;

const LICENSE_API_URL =
    import.meta.env
        .VITE_LICENSE_API_URL as
    | string
    | undefined;

/*
 * ---------------------------------------------------------
 * DATE HELPERS
 * ---------------------------------------------------------
 */

function addDays(
    isoDate: string,
    days: number,
): string {
    const date =
        new Date(
            isoDate,
        );

    date.setDate(
        date.getDate() +
        days,
    );

    return date.toISOString();
}

/*
 * ---------------------------------------------------------
 * INSTALLATION ID
 * ---------------------------------------------------------
 */

function createInstallationId():
    string {
    if (
        typeof crypto !==
        "undefined" &&
        typeof crypto.randomUUID ===
        "function"
    ) {
        return crypto.randomUUID();
    }

    return [
        Date.now()
            .toString(36),

        Math.random()
            .toString(36)
            .slice(
                2,
            ),
    ].join("-");
}

/*
 * ---------------------------------------------------------
 * TRIAL STATE
 * ---------------------------------------------------------
 */

function createTrialLicenseState():
    LicenseState {
    const trialStartedAt =
        new Date()
            .toISOString();

    return {
        status:
            "trial",

        edition:
            "Trial",

        installationId:
            createInstallationId(),

        trialStartedAt,

        trialExpiresAt:
            addDays(
                trialStartedAt,
                TRIAL_LENGTH_DAYS,
            ),

        entitlements: {
            premiumFeatures:
                [],
        },
    };
}

/*
 * ---------------------------------------------------------
 * PLAN / EDITION MAPPING
 * ---------------------------------------------------------
 */

function getEditionForPlan(
    plan:
        "free" |
        "pro" |
        "business",
): LicenseEdition {
    switch (
    plan
    ) {
        case "pro":
        case "business":
            return "Pro";

        case "free":
        default:
            return "Personal";
    }
}

/*
 * ---------------------------------------------------------
 * PLAN / ENTITLEMENT MAPPING
 * ---------------------------------------------------------
 */

function getEntitlementsForPlan(
    plan:
        "free" |
        "pro" |
        "business",
): LicenseEntitlements {
    if (
        plan ===
        "pro" ||
        plan ===
        "business"
    ) {
        return {
            premiumFeatures: [
                "calculator.materialIntegration",
                "calculator.machineIntegration",
                "calculator.advanced",
                "dualPane",
                "advancedAutomation",
            ],
        };
    }

    return {
        premiumFeatures: [
            "calculator.materialIntegration",
            "calculator.machineIntegration",
        ],
    };
}

/*
 * ---------------------------------------------------------
 * NORMALIZE LICENSE STATE
 * ---------------------------------------------------------
 */

function normalizeLicenseState(
    state: LicenseState,
): LicenseState {
    /*
     * Paid licenses do not expire based
     * on the local trial expiration date.
     */

    if (
        state.status ===
        "activated"
    ) {
        return state;
    }

    /*
     * Preserve explicitly deactivated
     * license state.
     */

    if (
        state.status ===
        "deactivated"
    ) {
        return state;
    }

    const trialExpiresAt =
        new Date(
            state.trialExpiresAt,
        ).getTime();

    if (
        Number.isFinite(
            trialExpiresAt,
        ) &&
        Date.now() >
        trialExpiresAt
    ) {
        return {
            ...state,

            status:
                "expired",

            edition:
                "Trial",

            entitlementToken:
                undefined,

            licenseKeyMasked:
                undefined,

            activatedAt:
                undefined,

            entitlements: {
                premiumFeatures:
                    [],
            },
        };
    }

    return {
        ...state,

        status:
            "trial",

        edition:
            "Trial",
    };
}

/*
 * ---------------------------------------------------------
 * LOCAL STORAGE
 * ---------------------------------------------------------
 */

function saveLicenseState(
    state: LicenseState,
): void {
    window.localStorage.setItem(
        LICENSE_STORAGE_KEY,
        JSON.stringify(
            state,
        ),
    );
}

export function getLicenseState():
    LicenseState {
    const raw =
        window.localStorage.getItem(
            LICENSE_STORAGE_KEY,
        );

    if (!raw) {
        const initialState =
            createTrialLicenseState();

        saveLicenseState(
            initialState,
        );

        return initialState;
    }

    try {
        const parsed =
            JSON.parse(
                raw,
            ) as LicenseState;

        const normalized =
            normalizeLicenseState(
                parsed,
            );

        saveLicenseState(
            normalized,
        );

        return normalized;
    } catch (error) {
        console.error(
            "Failed to read 3D PrintVault license state:",
            error,
        );

        const initialState =
            createTrialLicenseState();

        saveLicenseState(
            initialState,
        );

        return initialState;
    }
}

/*
 * ---------------------------------------------------------
 * TRIAL DAYS REMAINING
 * ---------------------------------------------------------
 */

export function getTrialDaysRemaining(
    state:
        LicenseState,
): number {
    if (
        state.status ===
        "activated"
    ) {
        return 0;
    }

    const expiration =
        new Date(
            state.trialExpiresAt,
        ).getTime();

    if (
        !Number.isFinite(
            expiration,
        )
    ) {
        return 0;
    }

    const difference =
        expiration -
        Date.now();

    if (
        difference <=
        0
    ) {
        return 0;
    }

    return Math.ceil(
        difference /
        (
            1000 *
            60 *
            60 *
            24
        ),
    );
}

/*
 * ---------------------------------------------------------
 * LICENSE KEY MASKING
 * ---------------------------------------------------------
 */

function maskLicenseKey(
    licenseKey:
        string,
): string {
    const trimmed =
        licenseKey
            .trim();

    if (
        trimmed.length <=
        8
    ) {
        return "••••••••";
    }

    return `${trimmed.slice(
        0,
        4,
    )}••••••••${trimmed.slice(
        -4,
    )}`;
}

/*
 * ---------------------------------------------------------
 * LICENSE API
 * ---------------------------------------------------------
 */

function requireLicenseApi():
    string {
    if (
        !LICENSE_API_URL
    ) {
        throw new Error(
            "The 3D PrintVault activation server is not configured yet.",
        );
    }

    return LICENSE_API_URL
        .replace(
            /\/+$/,
            "",
        );
}

/*
 * ---------------------------------------------------------
 * ACTIVATE LICENSE
 * ---------------------------------------------------------
 */

export async function activateLicense(
    licenseKey: string,
): Promise<LicenseState> {
    const trimmedLicenseKey =
        licenseKey
            .trim();

    if (
        !trimmedLicenseKey
    ) {
        throw new Error(
            "Enter a license key.",
        );
    }

    const current =
        getLicenseState();

    const apiUrl =
        requireLicenseApi();

    const response =
        await fetch(
            `${apiUrl}/v1/licenses/activate`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body:
                    JSON.stringify({
                        licenseKey:
                            trimmedLicenseKey,

                        /*
                         * The desktop calls this
                         * installationId internally.
                         *
                         * The licensing API expects
                         * deviceId.
                         */
                        deviceId:
                            current.installationId,

                        product:
                            "3d-printvault",
                    }),
            },
        );

    let result:
        LicenseActivationResponse;

    try {
        result =
            await response.json() as
            LicenseActivationResponse;
    } catch {
        throw new Error(
            "The activation server returned an invalid response.",
        );
    }

    if (
        !response.ok ||
        !result.success ||
        !result.plan ||
        !result.activationToken
    ) {
        throw new Error(
            result.message ??
            "The license could not be activated.",
        );
    }

    const now =
        new Date()
            .toISOString();

    const activated:
        LicenseState = {
        ...current,

        status:
            "activated",

        edition:
            getEditionForPlan(
                result.plan,
            ),

        activatedAt:
            result.activatedAt ??
            now,

        lastValidatedAt:
            now,

        licenseKeyMasked:
            maskLicenseKey(
                trimmedLicenseKey,
            ),

        /*
         * Backend calls this activationToken.
         *
         * Desktop stores it internally as
         * entitlementToken.
         */
        entitlementToken:
            result.activationToken,

        entitlements:
            getEntitlementsForPlan(
                result.plan,
            ),
    };

    saveLicenseState(
        activated,
    );

    return activated;
}

/*
 * ---------------------------------------------------------
 * VALIDATE LICENSE
 * ---------------------------------------------------------
 */

export async function validateLicense():
    Promise<LicenseState> {
    const current =
        getLicenseState();

    if (
        current.status !==
        "activated" ||
        !current.entitlementToken
    ) {
        return current;
    }

    const apiUrl =
        requireLicenseApi();

    const response =
        await fetch(
            `${apiUrl}/v1/licenses/validate`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${current.entitlementToken}`,
                },

                body:
                    JSON.stringify({
                        deviceId:
                            current.installationId,

                        product:
                            "3d-printvault",
                    }),
            },
        );

    let result:
        LicenseValidationResponse;

    try {
        result =
            await response.json() as
            LicenseValidationResponse;
    } catch {
        throw new Error(
            "The license server returned an invalid response.",
        );
    }

    if (
        !response.ok ||
        !result.valid
    ) {
        const invalidState:
            LicenseState = {
            ...current,

            status:
                "invalid",

            entitlementToken:
                undefined,

            entitlements: {
                premiumFeatures:
                    [],
            },
        };

        saveLicenseState(
            invalidState,
        );

        return invalidState;
    }

    /*
     * Validation does not issue a new
     * activation token.
     *
     * Continue using the token already
     * stored on this installation.
     */

    const validatedState:
        LicenseState = {
        ...current,

        status:
            "activated",

        edition:
            result.plan
                ? getEditionForPlan(
                    result.plan,
                )
                : current.edition,

        entitlementToken:
            current.entitlementToken,

        entitlements:
            result.plan
                ? getEntitlementsForPlan(
                    result.plan,
                )
                : current.entitlements,

        lastValidatedAt:
            new Date()
                .toISOString(),
    };

    saveLicenseState(
        validatedState,
    );

    return validatedState;
}

/*
 * ---------------------------------------------------------
 * DEACTIVATE LICENSE
 * ---------------------------------------------------------
 */

export async function deactivateLicense():
    Promise<LicenseState> {
    const current =
        getLicenseState();

    /*
     * Notify the activation server before
     * clearing the local activation.
     */

    if (
        LICENSE_API_URL &&
        current.entitlementToken
    ) {
        try {
            const apiUrl =
                LICENSE_API_URL
                    .replace(
                        /\/+$/,
                        "",
                    );

            const response =
                await fetch(
                    `${apiUrl}/v1/licenses/deactivate`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${current.entitlementToken}`,
                        },

                        body:
                            JSON.stringify({
                                deviceId:
                                    current.installationId,

                                product:
                                    "3d-printvault",
                            }),
                    },
                );

            if (
                !response.ok
            ) {
                console.warn(
                    "License server rejected the deactivation request.",
                );
            }
        } catch (error) {
            console.warn(
                "Unable to notify license server during deactivation:",
                error,
            );
        }
    }

    const deactivated:
        LicenseState = {
        ...current,

        status:
            "deactivated",

        edition:
            "Trial",

        activatedAt:
            undefined,

        lastValidatedAt:
            undefined,

        licenseKeyMasked:
            undefined,

        entitlementToken:
            undefined,

        entitlements: {
            premiumFeatures:
                [],
        },
    };

    saveLicenseState(
        deactivated,
    );

    return deactivated;
}

/*
 * ---------------------------------------------------------
 * LICENSE API STATUS
 * ---------------------------------------------------------
 */

export function isLicenseApiConfigured():
    boolean {
    return Boolean(
        LICENSE_API_URL,
    );
}

/*
 * ---------------------------------------------------------
 * EDITION DISPLAY
 * ---------------------------------------------------------
 */

export function getEditionDisplayName(
    edition:
        LicenseEdition,
): string {
    switch (
    edition
    ) {
        case "Pro":
            return "3D PrintVault Pro";

        case "Personal":
            return "3D PrintVault Personal";

        case "Trial":
        default:
            return "3D PrintVault Trial";
    }
}