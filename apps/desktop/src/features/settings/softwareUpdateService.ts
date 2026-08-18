import {
    check,
    type Update,
} from "@tauri-apps/plugin-updater";

import {
    relaunch,
} from "@tauri-apps/plugin-process";

export type SoftwareUpdateStatus =
    | "idle"
    | "checking"
    | "up-to-date"
    | "available"
    | "downloading"
    | "ready"
    | "installing"
    | "error";

export interface SoftwareUpdatePreferences {
    automaticChecks:
    boolean;

    lastCheckedAt?:
    string;
}

export interface SoftwareUpdateMetadata {
    version:
    string;

    currentVersion:
    string;

    date?:
    string;

    body?:
    string;
}

export interface SoftwareUpdateProgress {
    downloadedBytes:
    number;

    totalBytes:
    number;

    percent:
    number;
}

const STORAGE_KEY =
    "printvault.softwareUpdate";

export function getSoftwareUpdatePreferences():
    SoftwareUpdatePreferences {
    try {
        const raw =
            window.localStorage.getItem(
                STORAGE_KEY,
            );

        if (!raw) {
            return {
                automaticChecks:
                    true,
            };
        }

        const parsed =
            JSON.parse(
                raw,
            ) as Partial<
                SoftwareUpdatePreferences
            >;

        return {
            automaticChecks:
                parsed.automaticChecks ??
                true,

            lastCheckedAt:
                parsed.lastCheckedAt,
        };
    } catch {
        return {
            automaticChecks:
                true,
        };
    }
}

export function saveSoftwareUpdatePreferences(
    preferences:
        SoftwareUpdatePreferences,
): void {
    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            preferences,
        ),
    );
}

/*
 * Keep the actual Update resource in memory.
 *
 * It cannot safely be serialized to
 * localStorage because it represents a
 * Tauri-side resource.
 */

let availableUpdate:
    Update | null = null;

export function getAvailableUpdate():
    Update | null {
    return availableUpdate;
}

export async function checkForSoftwareUpdate():
    Promise<
        SoftwareUpdateMetadata | null
    > {
    const update =
        await check();

    const preferences =
        getSoftwareUpdatePreferences();

    saveSoftwareUpdatePreferences({
        ...preferences,

        lastCheckedAt:
            new Date()
                .toISOString(),
    });

    if (!update) {
        availableUpdate =
            null;

        return null;
    }

    availableUpdate =
        update;

    return {
        version:
            update.version,

        currentVersion:
            update.currentVersion,

        date:
            update.date,

        body:
            update.body,
    };
}

export async function downloadAndInstallSoftwareUpdate(
    onProgress: (
        progress:
            SoftwareUpdateProgress,
    ) => void,
): Promise<void> {
    const update =
        availableUpdate;

    if (!update) {
        throw new Error(
            "No software update is currently available.",
        );
    }

    let downloadedBytes =
        0;

    let totalBytes =
        0;

    await update.downloadAndInstall(
        (event) => {
            switch (
            event.event
            ) {
                case "Started": {
                    totalBytes =
                        event.data
                            .contentLength ??
                        0;

                    downloadedBytes =
                        0;

                    onProgress({
                        downloadedBytes:
                            0,

                        totalBytes,

                        percent:
                            0,
                    });

                    break;
                }

                case "Progress": {
                    downloadedBytes +=
                        event.data
                            .chunkLength;

                    const percent =
                        totalBytes > 0
                            ? Math.min(
                                100,
                                (
                                    downloadedBytes /
                                    totalBytes
                                ) *
                                100,
                            )
                            : 0;

                    onProgress({
                        downloadedBytes,

                        totalBytes,

                        percent,
                    });

                    break;
                }

                case "Finished": {
                    onProgress({
                        downloadedBytes:
                            totalBytes ||
                            downloadedBytes,

                        totalBytes,

                        percent:
                            100,
                    });

                    break;
                }
            }
        },
    );
}

export async function relaunchAfterUpdate():
    Promise<void> {
    await relaunch();
}