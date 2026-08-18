import {
    useEffect,
    useState,
} from "react";

import {
    FiCheckCircle,
    FiDownload,
    FiRefreshCw,
    FiRotateCw,
} from "react-icons/fi";

import {
    checkForSoftwareUpdate,
    downloadAndInstallSoftwareUpdate,
    getSoftwareUpdatePreferences,
    relaunchAfterUpdate,
    saveSoftwareUpdatePreferences,
    type SoftwareUpdateMetadata,
    type SoftwareUpdateProgress,
    type SoftwareUpdateStatus,
} from "../softwareUpdateService";

interface SoftwareUpdateCardProps {
    currentVersion:
    string;
}

function formatBytes(
    bytes: number,
): string {
    if (
        bytes <= 0 ||
        !Number.isFinite(
            bytes,
        )
    ) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
    ];

    let value =
        bytes;

    let index =
        0;

    while (
        value >=
        1024 &&
        index <
        units.length -
        1
    ) {
        value /=
            1024;

        index +=
            1;
    }

    return `${value.toFixed(
        index === 0
            ? 0
            : 1,
    )} ${units[index]}`;
}

export function SoftwareUpdateCard({
    currentVersion,
}: SoftwareUpdateCardProps) {
    const [
        preferences,
        setPreferences,
    ] =
        useState(
            () =>
                getSoftwareUpdatePreferences(),
        );

    const [
        status,
        setStatus,
    ] =
        useState<SoftwareUpdateStatus>(
            "idle",
        );

    const [
        update,
        setUpdate,
    ] =
        useState<SoftwareUpdateMetadata | null>(
            null,
        );

    const [
        progress,
        setProgress,
    ] =
        useState<SoftwareUpdateProgress>({
            downloadedBytes:
                0,

            totalBytes:
                0,

            percent:
                0,
        });

    const [
        errorMessage,
        setErrorMessage,
    ] =
        useState<string | null>(
            null,
        );

    async function handleCheckForUpdates(
        silent =
            false,
    ) {
        try {
            setErrorMessage(
                null,
            );

            if (!silent) {
                setStatus(
                    "checking",
                );
            }

            const result =
                await checkForSoftwareUpdate();

            const refreshedPreferences =
                getSoftwareUpdatePreferences();

            setPreferences(
                refreshedPreferences,
            );

            if (!result) {
                setUpdate(
                    null,
                );

                setStatus(
                    "up-to-date",
                );

                return;
            }

            setUpdate(
                result,
            );

            setStatus(
                "available",
            );
        } catch (error) {
            console.error(
                "Software update check failed:",
                error,
            );

            setErrorMessage(
                String(error),
            );

            setStatus(
                "error",
            );
        }
    }

    useEffect(() => {
        if (
            !preferences.automaticChecks
        ) {
            return;
        }

        /*
         * Avoid repeatedly hitting the
         * update endpoint while navigating
         * around Settings.
         *
         * Automatically check at most once
         * every 12 hours.
         */

        const lastChecked =
            preferences.lastCheckedAt
                ? new Date(
                    preferences.lastCheckedAt,
                ).getTime()
                : 0;

        const twelveHours =
            12 *
            60 *
            60 *
            1000;

        if (
            Date.now() -
            lastChecked <
            twelveHours
        ) {
            return;
        }

        void handleCheckForUpdates(
            true,
        );
        // Run once when this card mounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleAutomaticChecksChange(
        enabled: boolean,
    ) {
        const updated = {
            ...preferences,

            automaticChecks:
                enabled,
        };

        setPreferences(
            updated,
        );

        saveSoftwareUpdatePreferences(
            updated,
        );
    }

    async function handleInstall() {
        if (!update) {
            return;
        }

        try {
            setErrorMessage(
                null,
            );

            setStatus(
                "downloading",
            );

            setProgress({
                downloadedBytes:
                    0,

                totalBytes:
                    0,

                percent:
                    0,
            });

            await downloadAndInstallSoftwareUpdate(
                (nextProgress) => {
                    setProgress(
                        nextProgress,
                    );
                },
            );

            setStatus(
                "ready",
            );
        } catch (error) {
            console.error(
                "Software update install failed:",
                error,
            );

            setErrorMessage(
                String(error),
            );

            setStatus(
                "error",
            );
        }
    }

    async function handleRestart() {
        try {
            setStatus(
                "installing",
            );

            await relaunchAfterUpdate();
        } catch (error) {
            console.error(
                "Failed to relaunch after update:",
                error,
            );

            setErrorMessage(
                String(error),
            );

            setStatus(
                "error",
            );
        }
    }

    const busy =
        status ===
        "checking" ||
        status ===
        "downloading" ||
        status ===
        "installing";

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-zinc-500">
                    <FiRefreshCw />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-100">
                                Software Update
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Check for new 3D PrintVault releases and install updates securely.
                            </p>
                        </div>

                        {status ===
                            "up-to-date" && (
                                <span className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                                    <FiCheckCircle />

                                    Up to Date
                                </span>
                            )}

                        {status ===
                            "available" && (
                                <span className="shrink-0 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400">
                                    Update Available
                                </span>
                            )}
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-5">
                        <div className="flex items-center justify-between gap-6 border-b border-white/5 pb-3">
                            <div>
                                <p className="text-xs font-medium text-zinc-300">
                                    Current Version
                                </p>

                                <p className="mt-1 text-xs text-zinc-600">
                                    Installed version of 3D PrintVault
                                </p>
                            </div>

                            <span className="text-xs font-medium text-zinc-300">
                                v{
                                    currentVersion
                                }
                            </span>
                        </div>

                        {update && (
                            <div className="border-b border-white/5 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-zinc-300">
                                            Available Version
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-600">
                                            Ready to download
                                        </p>
                                    </div>

                                    <span className="text-xs font-semibold text-emerald-400">
                                        v{
                                            update.version
                                        }
                                    </span>
                                </div>

                                {(update.body ||
                                    update.date) && (
                                        <div className="mt-4 rounded-lg border border-white/10 bg-zinc-950 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                                What's New
                                            </p>

                                            {update.date && (
                                                <p className="mt-2 text-[10px] text-zinc-600">
                                                    {
                                                        update.date
                                                    }
                                                </p>
                                            )}

                                            {update.body && (
                                                <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                                                    {
                                                        update.body
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}

                        {(status ===
                            "downloading" ||
                            status ===
                            "ready") && (
                                <div className="border-b border-white/5 py-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500">
                                            Download
                                        </span>

                                        <span className="text-zinc-300">
                                            {
                                                progress.percent.toFixed(
                                                    0,
                                                )
                                            }
                                            %
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                        <div
                                            className="h-full rounded-full bg-red-600 transition-all"
                                            style={{
                                                width:
                                                    `${progress.percent}%`,
                                            }}
                                        />
                                    </div>

                                    {progress.totalBytes >
                                        0 && (
                                            <p className="mt-2 text-[10px] text-zinc-600">
                                                {formatBytes(
                                                    progress.downloadedBytes,
                                                )}{" "}
                                                of{" "}
                                                {formatBytes(
                                                    progress.totalBytes,
                                                )}
                                            </p>
                                        )}
                                </div>
                            )}

                        <div className="flex items-center justify-between gap-6 py-3">
                            <div>
                                <p className="text-xs font-medium text-zinc-300">
                                    Automatically Check for Updates
                                </p>

                                <p className="mt-1 text-xs text-zinc-600">
                                    Check periodically while using 3D PrintVault.
                                </p>
                            </div>

                            <input
                                type="checkbox"
                                checked={
                                    preferences.automaticChecks
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleAutomaticChecksChange(
                                        event.target.checked,
                                    )
                                }
                                className="h-4 w-4 accent-red-600"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                            <p className="text-xs text-zinc-600">
                                Last checked:{" "}
                                {preferences.lastCheckedAt
                                    ? new Date(
                                        preferences.lastCheckedAt,
                                    ).toLocaleString()
                                    : "Never"}
                            </p>

                            <div className="flex gap-2">
                                {status ===
                                    "available" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleInstall()
                                            }
                                            disabled={
                                                busy
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-40"
                                        >
                                            <FiDownload />

                                            Download & Install
                                        </button>
                                    )}

                                {status ===
                                    "ready" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleRestart()
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                                        >
                                            <FiRotateCw />

                                            Restart 3D PrintVault
                                        </button>
                                    )}

                                {status !==
                                    "ready" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleCheckForUpdates()
                                            }
                                            disabled={
                                                busy
                                            }
                                            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                                        >
                                            <FiRefreshCw
                                                className={
                                                    status ===
                                                        "checking"
                                                        ? "animate-spin"
                                                        : ""
                                                }
                                            />

                                            {status ===
                                                "checking"
                                                ? "Checking..."
                                                : "Check for Updates"}
                                        </button>
                                    )}
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                                {
                                    errorMessage
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}