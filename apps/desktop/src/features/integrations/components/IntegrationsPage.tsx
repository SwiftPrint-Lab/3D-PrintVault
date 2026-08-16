import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    externalApplications,
} from "../applications";

import {
    useInstalledApplications,
} from "../hooks/useInstalledApplications";

import {
    getDefaultApplicationPreferences,
    setDefaultApplication,
    clearDefaultApplication,
    type DefaultApplicationPreferences,
    type DefaultApplicationRole,
} from "../defaultApplicationPreferences";

type IntegrationStatus =
    | "Available"
    | "Not Installed"
    | "Future";

interface IntegrationItem {
    id: string;
    name: string;
    category: string;
    description: string;
    status: IntegrationStatus;
    details: string[];
    installedPath?: string;
}

function getIntegrationStatusClasses(
    status: IntegrationStatus,
) {
    switch (status) {
        case "Available":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "Not Installed":
            return "border-amber-500/20 bg-amber-500/10 text-amber-400";

        case "Future":
            return "border-zinc-500/20 bg-zinc-500/10 text-zinc-400";

        default:
            return "border-white/10 bg-white/[0.03] text-zinc-400";
    }
}

export function IntegrationsPage() {
    const {
        installedApps,
        installedById,
        loading,
        error,
    } = useInstalledApplications();

    const [
        defaultApplications,
        setDefaultApplications,
    ] = useState<DefaultApplicationPreferences>(
        {},
    );

    const detectionErrorMessage =
        error
            ? error instanceof Error
                ? error.message
                : String(error)
            : "";

    useEffect(() => {
        setDefaultApplications(
            getDefaultApplicationPreferences(),
        );
    }, []);

    const installedApplicationIds =
        useMemo(() => {
            return new Set(
                installedApps
                    .filter(
                        (app) =>
                            app.installed &&
                            Boolean(app.path),
                    )
                    .map(
                        (app) =>
                            app.id,
                    ),
            );
        }, [installedApps]);

    const installedSlicers =
        useMemo(() => {
            return externalApplications.filter(
                (application) =>
                    application.category ===
                    "slicer" &&
                    installedApplicationIds.has(
                        application.id,
                    ),
            );
        }, [
            installedApplicationIds,
        ]);

    const installedCadApps =
        useMemo(() => {
            return externalApplications.filter(
                (application) =>
                    application.category ===
                    "cad" &&
                    installedApplicationIds.has(
                        application.id,
                    ),
            );
        }, [
            installedApplicationIds,
        ]);

    const installedModelingApps =
        useMemo(() => {
            return externalApplications.filter(
                (application) =>
                    application.category ===
                    "modeling" &&
                    installedApplicationIds.has(
                        application.id,
                    ),
            );
        }, [
            installedApplicationIds,
        ]);

    const bambuStudio =
        installedById.get(
            "bambu-studio",
        );

    const fusion =
        installedById.get(
            "fusion",
        );

    const integrationItems: IntegrationItem[] = [
        {
            id: "local-file-system",
            name: "Local File System",
            category: "Local",
            description:
                "Import, locate, and open 3D assets directly from your Mac.",
            status: "Available",
            details: [
                "Import supported 3D files into PrintVault.",
                "Reveal original asset files directly in Finder.",
                "Copy the original local file path.",
                "Open files with the default macOS application.",
            ],
        },

        {
            id: "bambu-studio",
            name: "Bambu Studio",
            category: "Slicer",
            description:
                "Open supported PrintVault assets directly in Bambu Studio.",

            status:
                bambuStudio?.installed
                    ? "Available"
                    : "Not Installed",

            installedPath:
                bambuStudio?.path,

            details: [
                "Automatically detect Bambu Studio on macOS.",
                "Open STL, OBJ, 3MF, STEP, and STP assets directly in Bambu Studio.",
                "Launch models from PrintVault without manually locating the original file.",
            ],
        },

        {
            id: "fusion",
            name: "Autodesk Fusion",
            category: "CAD",
            description:
                "Open supported PrintVault assets directly in Autodesk Fusion.",

            status:
                fusion?.installed
                    ? "Available"
                    : "Not Installed",

            installedPath:
                fusion?.path,

            details: [
                "Automatically detect Autodesk Fusion on macOS.",
                "Open STL, OBJ, STEP, STP, IGES, IGS, F3D, and F3Z files in Fusion.",
                "Launch supported design files directly from the PrintVault Library.",
            ],
        },

        {
            id: "printvault-api",
            name: "PrintVault API",
            category: "Developer",
            description:
                "Expose PrintVault data and automation capabilities to external applications.",
            status: "Future",
            details: [
                "Programmatic asset access.",
                "Machine and job automation.",
                "External application integrations.",
            ],
        },
    ];

    const availableCount =
        integrationItems.filter(
            (item) =>
                item.status ===
                "Available",
        ).length;

    const notInstalledCount =
        integrationItems.filter(
            (item) =>
                item.status ===
                "Not Installed",
        ).length;

    const futureCount =
        integrationItems.filter(
            (item) =>
                item.status ===
                "Future",
        ).length;

    function updateDefaultApplication(
        role: DefaultApplicationRole,
        applicationId: string,
    ) {
        if (!applicationId) {
            clearDefaultApplication(
                role,
            );

            setDefaultApplications(
                (current) => ({
                    ...current,
                    [role]:
                        undefined,
                }),
            );

            return;
        }

        setDefaultApplication(
            role,
            applicationId,
        );

        setDefaultApplications(
            (current) => ({
                ...current,
                [role]:
                    applicationId,
            }),
        );
    }

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Integrations
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Connect PrintVault with your fabrication and design workflow.
                    </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-100">
                        {
                            integrationItems.length
                        }
                    </span>
                    {" "}
                    integrations
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {loading && (
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-zinc-500">
                        Detecting installed applications…
                    </div>
                )}

                {Boolean(error) && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                        Unable to detect installed applications
                        {detectionErrorMessage
                            ? `: ${detectionErrorMessage}`
                            : "."}
                    </div>
                )}

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                        <p className="text-xs text-zinc-500">
                            Available
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-emerald-400">
                            {
                                availableCount
                            }
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                        <p className="text-xs text-zinc-500">
                            Not Installed
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-amber-400">
                            {
                                notInstalledCount
                            }
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                        <p className="text-xs text-zinc-500">
                            Future
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-zinc-100">
                            {
                                futureCount
                            }
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-100">
                                Default Applications
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Choose which installed applications PrintVault should prefer for common workflows.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                        <DefaultApplicationSelect
                            label="Default Slicer"
                            value={
                                defaultApplications.slicer ??
                                ""
                            }
                            applications={
                                installedSlicers
                            }
                            loading={
                                loading
                            }
                            onChange={(value) =>
                                updateDefaultApplication(
                                    "slicer",
                                    value,
                                )
                            }
                        />

                        <DefaultApplicationSelect
                            label="Default CAD"
                            value={
                                defaultApplications.cad ??
                                ""
                            }
                            applications={
                                installedCadApps
                            }
                            loading={
                                loading
                            }
                            onChange={(value) =>
                                updateDefaultApplication(
                                    "cad",
                                    value,
                                )
                            }
                        />

                        <DefaultApplicationSelect
                            label="Default 3D Modeling"
                            value={
                                defaultApplications.modeling ??
                                ""
                            }
                            applications={
                                installedModelingApps
                            }
                            loading={
                                loading
                            }
                            onChange={(value) =>
                                updateDefaultApplication(
                                    "modeling",
                                    value,
                                )
                            }
                        />
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {integrationItems.map(
                        (integration) => (
                            <div
                                key={
                                    integration.id
                                }
                                className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                            {
                                                integration.category
                                            }
                                        </p>

                                        <h3 className="mt-2 text-sm font-semibold text-zinc-100">
                                            {
                                                integration.name
                                            }
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                                            {
                                                integration.description
                                            }
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium ${getIntegrationStatusClasses(
                                            integration.status,
                                        )}`}
                                    >
                                        {
                                            loading &&
                                                (
                                                    integration.id ===
                                                    "bambu-studio" ||
                                                    integration.id ===
                                                    "fusion"
                                                )
                                                ? "Detecting…"
                                                : integration.status
                                        }
                                    </span>
                                </div>

                                {integration.installedPath && (
                                    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                            Detected Application
                                        </p>

                                        <p className="mt-1 break-all text-xs text-zinc-400">
                                            {
                                                integration.installedPath
                                            }
                                        </p>
                                    </div>
                                )}

                                <div className="mt-5 border-t border-white/10 pt-4">
                                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                        Capabilities
                                    </p>

                                    <div className="space-y-2">
                                        {integration.details.map(
                                            (detail) => (
                                                <div
                                                    key={
                                                        detail
                                                    }
                                                    className="flex items-start gap-2 text-xs text-zinc-400"
                                                >
                                                    <span className="mt-[2px] text-zinc-600">
                                                        •
                                                    </span>

                                                    <span>
                                                        {
                                                            detail
                                                        }
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </section>
    );
}

interface DefaultApplicationSelectProps {
    label: string;
    value: string;
    applications:
    typeof externalApplications;
    loading: boolean;
    onChange: (
        value: string,
    ) => void;
}

function DefaultApplicationSelect({
    label,
    value,
    applications,
    loading,
    onChange,
}: DefaultApplicationSelectProps) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-medium text-zinc-400">
                {
                    label
                }
            </span>

            <select
                value={
                    value
                }
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                disabled={
                    loading
                }
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-red-600/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <option value="">
                    No default
                </option>

                {applications.map(
                    (application) => (
                        <option
                            key={
                                application.id
                            }
                            value={
                                application.id
                            }
                        >
                            {
                                application.label
                            }
                        </option>
                    ),
                )}
            </select>

            {!loading &&
                applications.length ===
                0 && (
                    <p className="mt-2 text-xs text-zinc-600">
                        No installed applications detected for this category.
                    </p>
                )}
        </label>
    );
}