import {
    invoke,
} from "@tauri-apps/api/core";

import {
    open,
    save,
} from "@tauri-apps/plugin-dialog";

import Database from "@tauri-apps/plugin-sql";

/*
 * ---------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------
 */

export type AutomaticBackupFrequency =
    | "off"
    | "daily"
    | "weekly";

export interface BackupSettings {
    location?: string;

    automaticFrequency:
    AutomaticBackupFrequency;

    lastBackupAt?: string;

    lastBackupPath?: string;
}

export interface BackupResult {
    path: string;

    createdAtUnixMs:
    number;

    databaseBytes:
    number;
}

export interface ApplicationDiagnosticInfo {
    version: string;

    productName: string;

    os: string;

    arch: string;

    databasePath: string;

    databaseExists: boolean;

    databaseBytes: number;
}

export interface DatabaseHealthSummary {
    integrity: string;

    counts: Record<
        string,
        number
    >;
}

/*
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

const BACKUP_SETTINGS_KEY =
    "printvault.backupSettings";

const RESET_PENDING_KEY =
    "printvault.resetPending";

const DATABASE_URL =
    "sqlite:3d-printvault.db";

const DATA_TABLES = [
    "assets",
    "machines",
    "materials",
    "jobs",
    "collections",
    "asset_collections",
    "categories",
    "asset_categories",
    "projects",
    "project_assets",
] as const;

/*
 * ---------------------------------------------------------
 * BACKUP SETTINGS
 * ---------------------------------------------------------
 */

export function getBackupSettings():
    BackupSettings {
    const raw =
        window.localStorage.getItem(
            BACKUP_SETTINGS_KEY,
        );

    if (!raw) {
        return {
            automaticFrequency:
                "off",
        };
    }

    try {
        const parsed =
            JSON.parse(
                raw,
            ) as BackupSettings;

        return {
            location:
                parsed.location,

            automaticFrequency:
                parsed.automaticFrequency ??
                "off",

            lastBackupAt:
                parsed.lastBackupAt,

            lastBackupPath:
                parsed.lastBackupPath,
        };
    } catch {
        return {
            automaticFrequency:
                "off",
        };
    }
}

export function saveBackupSettings(
    settings: BackupSettings,
): void {
    window.localStorage.setItem(
        BACKUP_SETTINGS_KEY,
        JSON.stringify(
            settings,
        ),
    );
}

/*
 * ---------------------------------------------------------
 * PREFERENCES
 * ---------------------------------------------------------
 */

function collectApplicationPreferences():
    string {
    const preferences:
        Record<
            string,
            string
        > = {};

    for (
        let index = 0;
        index <
        window.localStorage.length;
        index += 1
    ) {
        const key =
            window.localStorage.key(
                index,
            );

        if (
            !key ||
            !key.startsWith(
                "printvault.",
            )
        ) {
            continue;
        }

        /*
         * Backup location is machine-specific.
         * Do not restore it from another backup.
         */

        if (
            key ===
            BACKUP_SETTINGS_KEY ||
            key ===
            RESET_PENDING_KEY
        ) {
            continue;
        }

        const value =
            window.localStorage.getItem(
                key,
            );

        if (value !== null) {
            preferences[
                key
            ] =
                value;
        }
    }

    return JSON.stringify(
        preferences,
        null,
        2,
    );
}

function applyRestoredPreferences(
    preferencesJson: string,
): void {
    let preferences:
        Record<
            string,
            string
        >;

    try {
        preferences =
            JSON.parse(
                preferencesJson,
            ) as Record<
                string,
                string
            >;
    } catch {
        return;
    }

    const keysToRemove:
        string[] = [];

    for (
        let index = 0;
        index <
        window.localStorage.length;
        index += 1
    ) {
        const key =
            window.localStorage.key(
                index,
            );

        if (
            key?.startsWith(
                "printvault.",
            ) &&
            key !==
            BACKUP_SETTINGS_KEY &&
            key !==
            RESET_PENDING_KEY
        ) {
            keysToRemove.push(
                key,
            );
        }
    }

    for (
        const key
        of keysToRemove
    ) {
        window.localStorage.removeItem(
            key,
        );
    }

    for (
        const [
            key,
            value,
        ]
        of Object.entries(
            preferences,
        )
    ) {
        if (
            key.startsWith(
                "printvault.",
            ) &&
            typeof value ===
            "string"
        ) {
            window.localStorage.setItem(
                key,
                value,
            );
        }
    }
}

/*
 * ---------------------------------------------------------
 * SQLITE CHECKPOINT
 * ---------------------------------------------------------
 */

async function checkpointDatabase():
    Promise<void> {
    const database =
        await Database.load(
            DATABASE_URL,
        );

    try {
        await database.select(
            "PRAGMA wal_checkpoint(FULL)",
        );
    } catch (error) {
        console.warn(
            "Unable to checkpoint SQLite before backup:",
            error,
        );
    }
}

/*
 * ---------------------------------------------------------
 * BACKUP
 * ---------------------------------------------------------
 */

export async function chooseBackupLocation():
    Promise<string | null> {
    const selection =
        await open({
            directory:
                true,

            multiple:
                false,

            title:
                "Choose 3D PrintVault Backup Location",
        });

    if (
        !selection ||
        Array.isArray(
            selection,
        )
    ) {
        return null;
    }

    return selection;
}

export async function createBackup(
    destinationDirectory:
        string,
): Promise<BackupResult> {
    await checkpointDatabase();

    const result =
        await invoke<BackupResult>(
            "create_application_backup",
            {
                destinationDirectory,

                preferencesJson:
                    collectApplicationPreferences(),
            },
        );

    const current =
        getBackupSettings();

    saveBackupSettings({
        ...current,

        location:
            destinationDirectory,

        lastBackupAt:
            new Date().toISOString(),

        lastBackupPath:
            result.path,
    });

    return result;
}

/*
 * ---------------------------------------------------------
 * AUTOMATIC BACKUP
 * ---------------------------------------------------------
 */

function automaticBackupIntervalMs(
    frequency:
        AutomaticBackupFrequency,
): number | null {
    switch (frequency) {
        case "daily":
            return (
                24 *
                60 *
                60 *
                1000
            );

        case "weekly":
            return (
                7 *
                24 *
                60 *
                60 *
                1000
            );

        case "off":
        default:
            return null;
    }
}

export async function maybeRunAutomaticBackup():
    Promise<BackupResult | null> {
    const settings =
        getBackupSettings();

    const interval =
        automaticBackupIntervalMs(
            settings.automaticFrequency,
        );

    if (
        !interval ||
        !settings.location
    ) {
        return null;
    }

    const lastBackupTime =
        settings.lastBackupAt
            ? new Date(
                settings.lastBackupAt,
            ).getTime()
            : 0;

    if (
        Date.now() -
        lastBackupTime <
        interval
    ) {
        return null;
    }

    return createBackup(
        settings.location,
    );
}

/*
 * ---------------------------------------------------------
 * RESTORE
 * ---------------------------------------------------------
 */

export async function chooseBackupForRestore():
    Promise<string | null> {
    const selection =
        await open({
            directory:
                true,

            multiple:
                false,

            title:
                "Choose 3D PrintVault Backup",
        });

    if (
        !selection ||
        Array.isArray(
            selection,
        )
    ) {
        return null;
    }

    return selection;
}

export async function stageRestore(
    backupDirectory:
        string,
): Promise<void> {
    await invoke(
        "stage_application_restore",
        {
            backupDirectory,
        },
    );
}

/*
 * Apply preferences from a restore after
 * Rust has replaced the database at startup.
 */
export async function applyPendingStartupRecovery():
    Promise<void> {
    if (
        window.localStorage.getItem(
            RESET_PENDING_KEY,
        ) ===
        "true"
    ) {
        const keys:
            string[] = [];

        for (
            let index = 0;
            index <
            window.localStorage.length;
            index += 1
        ) {
            const key =
                window.localStorage.key(
                    index,
                );

            if (
                key?.startsWith(
                    "printvault.",
                )
            ) {
                keys.push(
                    key,
                );
            }
        }

        for (
            const key
            of keys
        ) {
            window.localStorage.removeItem(
                key,
            );
        }

        return;
    }

    const preferences =
        await invoke<
            string | null
        >(
            "consume_pending_restore_preferences",
        );

    if (preferences) {
        applyRestoredPreferences(
            preferences,
        );
    }
}

/*
 * ---------------------------------------------------------
 * JSON EXPORT
 * ---------------------------------------------------------
 */

async function loadAllDatabaseData():
    Promise<
        Record<
            string,
            unknown
        >
    > {
    const database =
        await Database.load(
            DATABASE_URL,
        );

    const tables:
        Record<
            string,
            unknown
        > = {};

    for (
        const table
        of DATA_TABLES
    ) {
        tables[
            table
        ] =
            await database.select(
                `SELECT * FROM ${table}`,
            );
    }

    return tables;
}

export async function exportApplicationData():
    Promise<string | null> {
    const path =
        await save({
            title:
                "Export 3D PrintVault Data",

            defaultPath:
                "3D-PrintVault-Export.json",

            filters: [
                {
                    name:
                        "JSON",

                    extensions: [
                        "json",
                    ],
                },
            ],
        });

    if (!path) {
        return null;
    }

    const tables =
        await loadAllDatabaseData();

    const exportDocument = {
        product:
            "3D PrintVault",

        exportVersion:
            1,

        exportedAt:
            new Date()
                .toISOString(),

        tables,
    };

    await invoke(
        "write_application_text_file",
        {
            path,

            contents:
                JSON.stringify(
                    exportDocument,
                    null,
                    2,
                ),
        },
    );

    return path;
}

/*
 * ---------------------------------------------------------
 * DATABASE HEALTH
 * ---------------------------------------------------------
 */

export async function getDatabaseHealthSummary():
    Promise<DatabaseHealthSummary> {
    const database =
        await Database.load(
            DATABASE_URL,
        );

    const integrityRows =
        await database.select<
            {
                integrity_check:
                string;
            }[]
        >(
            "PRAGMA integrity_check",
        );

    const counts:
        Record<
            string,
            number
        > = {};

    for (
        const table
        of DATA_TABLES
    ) {
        const rows =
            await database.select<
                {
                    count:
                    number;
                }[]
            >(
                `SELECT COUNT(*) AS count FROM ${table}`,
            );

        counts[
            table
        ] =
            Number(
                rows[0]?.count ??
                0,
            );
    }

    return {
        integrity:
            integrityRows[0]
                ?.integrity_check ??
            "Unknown",

        counts,
    };
}

/*
 * ---------------------------------------------------------
 * DIAGNOSTICS
 * ---------------------------------------------------------
 */

export async function getApplicationDiagnosticInfo():
    Promise<ApplicationDiagnosticInfo> {
    return invoke<
        ApplicationDiagnosticInfo
    >(
        "get_application_diagnostic_info",
    );
}

export async function createProblemReport(
    description: string,
): Promise<string | null> {
    const path =
        await save({
            title:
                "Save 3D PrintVault Problem Report",

            defaultPath:
                "3D-PrintVault-Problem-Report.json",

            filters: [
                {
                    name:
                        "JSON",

                    extensions: [
                        "json",
                    ],
                },
            ],
        });

    if (!path) {
        return null;
    }

    const [
        application,
        database,
    ] =
        await Promise.all([
            getApplicationDiagnosticInfo(),
            getDatabaseHealthSummary(),
        ]);

    const report = {
        product:
            "3D PrintVault",

        createdAt:
            new Date()
                .toISOString(),

        description:
            description.trim(),

        application,

        database,

        note:
            "This report contains diagnostic metadata and database record counts. It does not contain the 3D PrintVault database or original 3D model files.",
    };

    await invoke(
        "write_application_text_file",
        {
            path,

            contents:
                JSON.stringify(
                    report,
                    null,
                    2,
                ),
        },
    );

    return path;
}

/*
 * ---------------------------------------------------------
 * RESET
 * ---------------------------------------------------------
 */

export async function stageApplicationReset():
    Promise<void> {
    window.localStorage.setItem(
        RESET_PENDING_KEY,
        "true",
    );

    try {
        await invoke(
            "stage_application_reset",
        );
    } catch (error) {
        window.localStorage.removeItem(
            RESET_PENDING_KEY,
        );

        throw error;
    }
}