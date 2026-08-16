import { FiExternalLink } from "react-icons/fi";

import type { Asset } from "../types/asset";

import {
    externalApplications,
    getCompatibleApplications,
} from "../../integrations/applications";

import {
    useInstalledApplications,
} from "../../integrations/hooks/useInstalledApplications";

import {
    chooseApplicationForAsset,
    openAssetInApplication,
} from "../../integrations/openWithService";

import {
    getDefaultApplicationPreferences,
} from "../../integrations/defaultApplicationPreferences";

interface OpenInMenuProps {
    asset: Asset;
}

export function OpenInMenu({
    asset,
}: OpenInMenuProps) {
    const compatibleApplications =
        getCompatibleApplications(
            asset.extension,
        );

    const {
        installedById,
        loading,
    } = useInstalledApplications();

    const defaultPreferences =
        getDefaultApplicationPreferences();

    const availableApplications =
        compatibleApplications.filter(
            (application) => {
                const detected =
                    installedById.get(
                        application.id,
                    );

                return (
                    detected?.installed &&
                    Boolean(
                        detected.path,
                    )
                );
            },
        );

    /*
     * ---------------------------------------------------------
     * DETERMINE DEFAULT APPLICATION
     * ---------------------------------------------------------
     */

    const defaultApplicationId =
        getDefaultApplicationIdForAsset(
            asset.extension,
            defaultPreferences,
        );

    const defaultApplication =
        defaultApplicationId
            ? externalApplications.find(
                (application) =>
                    application.id ===
                    defaultApplicationId,
            )
            : undefined;

    const defaultDetectedApplication =
        defaultApplication
            ? installedById.get(
                defaultApplication.id,
            )
            : undefined;

    const defaultApplicationCanOpenAsset =
        Boolean(
            defaultApplication &&
            defaultDetectedApplication?.installed &&
            defaultDetectedApplication.path &&
            compatibleApplications.some(
                (application) =>
                    application.id ===
                    defaultApplication.id,
            ),
        );

    /*
     * ---------------------------------------------------------
     * OPEN APPLICATION
     * ---------------------------------------------------------
     */

    async function handleOpen(
        applicationId: string,
    ) {
        if (!asset.path) {
            return;
        }

        const application =
            compatibleApplications.find(
                (item) =>
                    item.id ===
                    applicationId,
            );

        if (!application) {
            return;
        }

        const detected =
            installedById.get(
                application.id,
            );

        if (
            !detected?.installed ||
            !detected.path
        ) {
            alert(
                `${application.label} is not installed or could not be detected.`,
            );

            return;
        }

        try {
            await openAssetInApplication(
                asset.path,
                detected.path,
            );
        } catch (error) {
            console.error(
                `Failed to open in ${application.label}:`,
                error,
            );

            alert(
                `Unable to open in ${application.label}: ${String(error)}`,
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * OPEN DEFAULT APPLICATION
     * ---------------------------------------------------------
     */

    async function handleOpenDefault() {
        if (
            !asset.path ||
            !defaultApplication ||
            !defaultDetectedApplication?.path ||
            !defaultApplicationCanOpenAsset
        ) {
            return;
        }

        try {
            await openAssetInApplication(
                asset.path,
                defaultDetectedApplication.path,
            );
        } catch (error) {
            console.error(
                `Failed to open in default application ${defaultApplication.label}:`,
                error,
            );

            alert(
                `Unable to open in ${defaultApplication.label}: ${String(error)}`,
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * CHOOSE APPLICATION
     * ---------------------------------------------------------
     */

    async function handleChooseApplication() {
        if (!asset.path) {
            return;
        }

        try {
            await chooseApplicationForAsset(
                asset.path,
            );
        } catch (error) {
            console.error(
                "Failed to choose application:",
                error,
            );

            alert(
                `Unable to choose application: ${String(error)}`,
            );
        }
    }

    return (
        <>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Open In
            </p>

            {loading ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-3 text-xs text-zinc-500">
                    Detecting installed applications…
                </div>
            ) : (
                <>
                    {defaultApplicationCanOpenAsset &&
                        defaultApplication && (
                            <div className="mb-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleOpenDefault()
                                    }
                                    disabled={
                                        !asset.path
                                    }
                                    className="flex w-full items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span>
                                        Open in{" "}
                                        {
                                            defaultApplication.label
                                        }
                                    </span>

                                    <FiExternalLink />
                                </button>

                                <p className="mt-2 text-[10px] text-zinc-600">
                                    Default application
                                </p>
                            </div>
                        )}

                    <div className="space-y-2">
                        {availableApplications.map(
                            (application) => (
                                <button
                                    key={
                                        application.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        void handleOpen(
                                            application.id,
                                        )
                                    }
                                    disabled={
                                        !asset.path
                                    }
                                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-sm text-zinc-300 transition hover:border-red-600/30 hover:bg-red-950/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span>
                                        {
                                            application.label
                                        }
                                    </span>

                                    <FiExternalLink className="text-zinc-600" />
                                </button>
                            ),
                        )}
                    </div>

                    {availableApplications.length ===
                        0 && (
                            <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-3 text-xs text-zinc-500">
                                No compatible installed applications were detected.
                            </div>
                        )}
                </>
            )}

            <button
                type="button"
                onClick={() =>
                    void handleChooseApplication()
                }
                disabled={
                    !asset.path
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
                <FiExternalLink />

                Choose Application…
            </button>
        </>
    );
}

function getDefaultApplicationIdForAsset(
    extension: string,
    preferences: ReturnType<
        typeof getDefaultApplicationPreferences
    >,
): string | undefined {
    const normalized =
        extension.toUpperCase();

    /*
     * CAD-native files should prefer
     * the configured CAD application.
     */

    if (
        [
            "STEP",
            "STP",
            "IGES",
            "IGS",
            "F3D",
            "F3Z",
        ].includes(
            normalized,
        )
    ) {
        return preferences.cad;
    }

    /*
     * Modeling-oriented files should prefer
     * the configured modeling application.
     */

    if (
        [
            "FBX",
            "GLB",
            "GLTF",
            "PLY",
        ].includes(
            normalized,
        )
    ) {
        return preferences.modeling;
    }

    /*
     * Printable mesh/project files prefer
     * the configured slicer.
     */

    if (
        [
            "STL",
            "OBJ",
            "3MF",
        ].includes(
            normalized,
        )
    ) {
        return preferences.slicer;
    }

    return undefined;
}