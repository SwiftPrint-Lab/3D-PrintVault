import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    FiAlertTriangle,
    FiArchive,
    FiDownload,
    FiFileText,
    FiFolder,
    FiRefreshCw,
    FiRotateCcw,
    FiSave,
    FiShield,
} from "react-icons/fi";

import {
    chooseBackupForRestore,
    chooseBackupLocation,
    createBackup,
    createProblemReport,
    exportApplicationData,
    getApplicationDiagnosticInfo,
    getBackupSettings,
    getDatabaseHealthSummary,
    saveBackupSettings,
    stageApplicationReset,
    stageRestore,
    type ApplicationDiagnosticInfo,
    type AutomaticBackupFrequency,
    type BackupSettings,
    type DatabaseHealthSummary,
} from "../backupService";
import {
    SoftwareUpdateCard,
} from "./SoftwareUpdateCard";

function formatBytes(
    bytes: number,
): string {
    if (
        !Number.isFinite(
            bytes,
        ) ||
        bytes <= 0
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

    let unitIndex =
        0;

    while (
        value >=
        1024 &&
        unitIndex <
        units.length -
        1
    ) {
        value /=
            1024;

        unitIndex +=
            1;
    }

    return `${value.toFixed(
        unitIndex === 0
            ? 0
            : 1,
    )} ${units[unitIndex]}`;
}

export function SettingsPage() {
    const [
        backupSettings,
        setBackupSettings,
    ] =
        useState<BackupSettings>(
            () =>
                getBackupSettings(),
        );

    const [
        diagnosticInfo,
        setDiagnosticInfo,
    ] =
        useState<ApplicationDiagnosticInfo | null>(
            null,
        );

    const [
        databaseHealth,
        setDatabaseHealth,
    ] =
        useState<DatabaseHealthSummary | null>(
            null,
        );

    const [
        problemDescription,
        setProblemDescription,
    ] = useState("");

    const [
        busyAction,
        setBusyAction,
    ] =
        useState<string | null>(
            null,
        );

    const [
        statusMessage,
        setStatusMessage,
    ] =
        useState<string | null>(
            null,
        );

    useEffect(() => {
        async function loadInfo() {
            try {
                const [
                    diagnostics,
                    health,
                ] =
                    await Promise.all([
                        getApplicationDiagnosticInfo(),
                        getDatabaseHealthSummary(),
                    ]);

                setDiagnosticInfo(
                    diagnostics,
                );

                setDatabaseHealth(
                    health,
                );
            } catch (error) {
                console.error(
                    "Failed to load Settings diagnostics:",
                    error,
                );
            }
        }

        void loadInfo();
    }, []);

    function updateBackupSettings(
        next:
            BackupSettings,
    ) {
        setBackupSettings(
            next,
        );

        saveBackupSettings(
            next,
        );
    }

    async function handleChooseLocation() {
        const location =
            await chooseBackupLocation();

        if (!location) {
            return;
        }

        updateBackupSettings({
            ...backupSettings,
            location,
        });
    }

    async function handleCreateBackup() {
        try {
            setBusyAction(
                "backup",
            );

            setStatusMessage(
                null,
            );

            let location =
                backupSettings.location;

            if (!location) {
                location =
                    await chooseBackupLocation() ??
                    undefined;

                if (!location) {
                    return;
                }

                updateBackupSettings({
                    ...backupSettings,
                    location,
                });
            }

            const result =
                await createBackup(
                    location,
                );

            const refreshed =
                getBackupSettings();

            setBackupSettings(
                refreshed,
            );

            setStatusMessage(
                `Backup created: ${result.path}`,
            );
        } catch (error) {
            console.error(
                "Backup failed:",
                error,
            );

            alert(
                `Backup failed: ${String(error)}`,
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleRestore() {
        const backup =
            await chooseBackupForRestore();

        if (!backup) {
            return;
        }

        const confirmed =
            window.confirm(
                "Restore this 3D PrintVault backup?\n\nThe restore will be applied the next time you quit and reopen 3D PrintVault. A safety copy of your current database will be kept.",
            );

        if (!confirmed) {
            return;
        }

        try {
            setBusyAction(
                "restore",
            );

            await stageRestore(
                backup,
            );

            setStatusMessage(
                "Restore staged successfully. Quit 3D PrintVault completely and reopen it to apply the backup.",
            );
        } catch (error) {
            console.error(
                "Restore staging failed:",
                error,
            );

            alert(
                `Restore failed: ${String(error)}`,
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleExport() {
        try {
            setBusyAction(
                "export",
            );

            const path =
                await exportApplicationData();

            if (path) {
                setStatusMessage(
                    `Data exported: ${path}`,
                );
            }
        } catch (error) {
            console.error(
                "Export failed:",
                error,
            );

            alert(
                `Export failed: ${String(error)}`,
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleProblemReport() {
        try {
            setBusyAction(
                "report",
            );

            const path =
                await createProblemReport(
                    problemDescription,
                );

            if (path) {
                setStatusMessage(
                    `Problem report created: ${path}`,
                );

                setProblemDescription(
                    "",
                );
            }
        } catch (error) {
            console.error(
                "Problem report failed:",
                error,
            );

            alert(
                `Unable to create problem report: ${String(error)}`,
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleRefreshDiagnostics() {
        try {
            setBusyAction(
                "diagnostics",
            );

            const [
                diagnostics,
                health,
            ] =
                await Promise.all([
                    getApplicationDiagnosticInfo(),
                    getDatabaseHealthSummary(),
                ]);

            setDiagnosticInfo(
                diagnostics,
            );

            setDatabaseHealth(
                health,
            );
        } catch (error) {
            alert(
                `Unable to refresh diagnostics: ${String(error)}`,
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleReset() {
        const confirmed =
            window.confirm(
                "Reset 3D PrintVault?\n\nThis will erase the 3D PrintVault database, categories, collections, projects, machines, materials, jobs, favorites, and application preferences on the next restart.\n\nOriginal STL, 3MF, OBJ, STEP, and other source files on your Mac will NOT be deleted.",
            );

        if (!confirmed) {
            return;
        }

        const secondConfirmation =
            window.confirm(
                "Are you certain you want to reset 3D PrintVault? This cannot be undone unless you have a backup.",
            );

        if (!secondConfirmation) {
            return;
        }

        try {
            setBusyAction(
                "reset",
            );

            await stageApplicationReset();

            setStatusMessage(
                "Reset staged. Quit 3D PrintVault completely and reopen it to finish resetting the application.",
            );
        } catch (error) {
            alert(
                `Unable to stage reset: ${String(error)}`,
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-white/10 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-100">
                    Settings
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                    Manage 3D PrintVault backups, recovery, diagnostics, and application information.
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-5xl space-y-6">
                    {statusMessage && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
                            {
                                statusMessage
                            }
                        </div>
                    )}

                    {/* BACKUP */}

                    <SoftwareUpdateCard
                        currentVersion={
                            diagnosticInfo?.version ??
                            "0.1.0"
                        }
                    />

                    <SettingsCard
                        icon={
                            <FiSave />
                        }
                        title="Backup"
                        description="Create a safety copy of the 3D PrintVault database and application preferences."
                    >
                        <SettingsRow
                            label="Backup Location"
                            value={
                                backupSettings.location ??
                                "Not configured"
                            }
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    void handleChooseLocation()
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white"
                            >
                                <FiFolder className="mr-2 inline" />
                                Choose
                            </button>
                        </SettingsRow>

                        <SettingsRow
                            label="Automatic Backups"
                            value="Runs while 3D PrintVault is open."
                        >
                            <select
                                value={
                                    backupSettings.automaticFrequency
                                }
                                onChange={(
                                    event,
                                ) => {
                                    const automaticFrequency =
                                        event.target.value as AutomaticBackupFrequency;

                                    updateBackupSettings({
                                        ...backupSettings,
                                        automaticFrequency,
                                    });
                                }}
                                className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-red-600/60"
                            >
                                <option value="off">
                                    Off
                                </option>

                                <option value="daily">
                                    Daily
                                </option>

                                <option value="weekly">
                                    Weekly
                                </option>
                            </select>
                        </SettingsRow>

                        <SettingsRow
                            label="Last Backup"
                            value={
                                backupSettings.lastBackupAt
                                    ? new Date(
                                        backupSettings.lastBackupAt,
                                    ).toLocaleString()
                                    : "Never"
                            }
                        />

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleCreateBackup()
                                }
                                disabled={
                                    busyAction !==
                                    null
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-40"
                            >
                                {busyAction ===
                                    "backup"
                                    ? "Creating Backup..."
                                    : "Create Backup"}
                            </button>
                        </div>
                    </SettingsCard>

                    {/* RESTORE */}

                    <SettingsCard
                        icon={
                            <FiRotateCcw />
                        }
                        title="Restore"
                        description="Restore the 3D PrintVault database and saved application preferences from a backup."
                    >
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-400">
                            Restore is staged safely and applied after you completely quit and reopen 3D PrintVault.
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleRestore()
                                }
                                disabled={
                                    busyAction !==
                                    null
                                }
                                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white disabled:opacity-40"
                            >
                                Choose Backup & Restore
                            </button>
                        </div>
                    </SettingsCard>

                    {/* EXPORT */}

                    <SettingsCard
                        icon={
                            <FiDownload />
                        }
                        title="Export 3D PrintVault Data"
                        description="Export database records to a readable JSON file."
                    >
                        <p className="text-xs leading-5 text-zinc-500">
                            The export includes asset metadata, machines, materials, jobs, collections, categories, projects, and relationships. Original 3D model files are not copied.
                        </p>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleExport()
                                }
                                disabled={
                                    busyAction !==
                                    null
                                }
                                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                            >
                                Export JSON
                            </button>
                        </div>
                    </SettingsCard>

                    {/* DIAGNOSTICS */}

                    <SettingsCard
                        icon={
                            <FiShield />
                        }
                        title="Diagnostics"
                        description="Review database health and create a problem report."
                    >
                        <div className="grid gap-3 md:grid-cols-3">
                            <Metric
                                label="Database"
                                value={
                                    databaseHealth?.integrity ??
                                    "Loading..."
                                }
                            />

                            <Metric
                                label="Assets"
                                value={
                                    String(
                                        databaseHealth
                                            ?.counts
                                            .assets ??
                                        0,
                                    )
                                }
                            />

                            <Metric
                                label="Database Size"
                                value={
                                    diagnosticInfo
                                        ? formatBytes(
                                            diagnosticInfo.databaseBytes,
                                        )
                                        : "Loading..."
                                }
                            />
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleRefreshDiagnostics()
                                }
                                disabled={
                                    busyAction !==
                                    null
                                }
                                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                                <FiRefreshCw />

                                Refresh
                            </button>
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-5">
                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Problem Description
                                </span>

                                <textarea
                                    rows={4}
                                    value={
                                        problemDescription
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setProblemDescription(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Describe what happened, what you expected, and any steps that reproduce the issue..."
                                    className="w-full resize-y rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>

                            <div className="mt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleProblemReport()
                                    }
                                    disabled={
                                        busyAction !==
                                        null
                                    }
                                    className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white"
                                >
                                    <FiFileText />

                                    Create Problem Report
                                </button>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* APPLICATION */}

                    <SettingsCard
                        icon={
                            <FiArchive />
                        }
                        title="Application"
                        description="Version, build information, and what's new."
                    >
                        <SettingsRow
                            label="Product"
                            value="3D PrintVault"
                        />

                        <SettingsRow
                            label="Version"
                            value={
                                diagnosticInfo?.version ??
                                "Loading..."
                            }
                        />

                        <SettingsRow
                            label="Platform"
                            value={
                                diagnosticInfo
                                    ? `${diagnosticInfo.os} · ${diagnosticInfo.arch}`
                                    : "Loading..."
                            }
                        />

                        <div className="mt-5 border-t border-white/10 pt-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                What's New
                            </p>

                            <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-400">
                                <p>
                                    • Categories and nested virtual folders
                                </p>

                                <p>
                                    • Add, remove, and move assets between folders
                                </p>

                                <p>
                                    • Bambu Studio and Autodesk Fusion integrations
                                </p>

                                <p>
                                    • Machines, Materials, Jobs, Projects, and Collections
                                </p>

                                <p>
                                    • 3D Calculator for print cost, pricing, and profit
                                </p>

                                <p>
                                    • Backup, restore, export, diagnostics, and recovery tools
                                </p>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* DANGER ZONE */}

                    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-red-400">
                                <FiAlertTriangle />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-red-400">
                                    Danger Zone
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    Resetting removes 3D PrintVault application data. It does not delete the original 3D model files referenced by the Library.
                                </p>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleReset()
                                        }
                                        disabled={
                                            busyAction !==
                                            null
                                        }
                                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40"
                                    >
                                        Reset Application Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

interface SettingsCardProps {
    icon:
    ReactNode;

    title:
    string;

    description:
    string;

    children:
    ReactNode;
}

function SettingsCard({
    icon,
    title,
    description,
    children,
}: SettingsCardProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-zinc-500">
                    {
                        icon
                    }
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                        {
                            title
                        }
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {
                            description
                        }
                    </p>
                </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
                {
                    children
                }
            </div>
        </div>
    );
}

interface SettingsRowProps {
    label:
    string;

    value:
    string;

    children?:
    ReactNode;
}

function SettingsRow({
    label,
    value,
    children,
}: SettingsRowProps) {
    return (
        <div className="flex items-center justify-between gap-6 border-b border-white/5 py-3 first:pt-0 last:border-b-0 last:pb-0">
            <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-300">
                    {
                        label
                    }
                </p>

                <p className="mt-1 truncate text-xs text-zinc-600">
                    {
                        value
                    }
                </p>
            </div>

            {
                children
            }
        </div>
    );
}

interface MetricProps {
    label:
    string;

    value:
    string;
}

function Metric({
    label,
    value,
}: MetricProps) {
    return (
        <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {
                    label
                }
            </p>

            <p className="mt-2 text-sm font-semibold text-zinc-200">
                {
                    value
                }
            </p>
        </div>
    );
}