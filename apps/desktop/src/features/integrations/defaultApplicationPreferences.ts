export type DefaultApplicationRole =
    | "slicer"
    | "cad"
    | "modeling";

export interface DefaultApplicationPreferences {
    slicer?: string;
    cad?: string;
    modeling?: string;
}

const STORAGE_KEY =
    "printvault.defaultApplications";

function readStoredPreferences():
    DefaultApplicationPreferences {
    try {
        const raw =
            window.localStorage.getItem(
                STORAGE_KEY,
            );

        if (!raw) {
            return {};
        }

        const parsed =
            JSON.parse(
                raw,
            ) as unknown;

        if (
            typeof parsed !==
            "object" ||
            parsed === null
        ) {
            return {};
        }

        const record =
            parsed as Record<
                string,
                unknown
            >;

        const preferences:
            DefaultApplicationPreferences =
            {};

        if (
            typeof record.slicer ===
            "string"
        ) {
            preferences.slicer =
                record.slicer;
        }

        if (
            typeof record.cad ===
            "string"
        ) {
            preferences.cad =
                record.cad;
        }

        if (
            typeof record.modeling ===
            "string"
        ) {
            preferences.modeling =
                record.modeling;
        }

        return preferences;
    } catch (error) {
        console.error(
            "Failed to read default application preferences:",
            error,
        );

        return {};
    }
}

function writeStoredPreferences(
    preferences:
        DefaultApplicationPreferences,
): void {
    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            preferences,
        ),
    );
}

export function getDefaultApplicationPreferences():
    DefaultApplicationPreferences {
    return readStoredPreferences();
}

export function getDefaultApplication(
    role: DefaultApplicationRole,
): string | undefined {
    const preferences =
        readStoredPreferences();

    return preferences[
        role
    ];
}

export function setDefaultApplication(
    role: DefaultApplicationRole,
    applicationId: string,
): void {
    const trimmedApplicationId =
        applicationId.trim();

    if (
        !trimmedApplicationId
    ) {
        throw new Error(
            "Application ID cannot be empty.",
        );
    }

    const current =
        readStoredPreferences();

    const updated:
        DefaultApplicationPreferences =
    {
        ...current,

        [role]:
            trimmedApplicationId,
    };

    writeStoredPreferences(
        updated,
    );
}

export function clearDefaultApplication(
    role: DefaultApplicationRole,
): void {
    const current =
        readStoredPreferences();

    const updated:
        DefaultApplicationPreferences =
    {
        ...current,
    };

    delete updated[
        role
    ];

    writeStoredPreferences(
        updated,
    );
}

export function resetDefaultApplications():
    void {
    window.localStorage.removeItem(
        STORAGE_KEY,
    );
}