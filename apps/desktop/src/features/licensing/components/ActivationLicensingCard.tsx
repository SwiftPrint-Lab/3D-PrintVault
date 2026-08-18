import {
    useState,
    type ReactNode,
} from "react";

import {
    FiCheckCircle,
    FiKey,
    FiLock,
    FiMonitor,
    FiRefreshCw,
    FiShoppingBag,
    FiUnlock,
} from "react-icons/fi";

import {
    activateLicense,
    deactivateLicense,
    getEditionDisplayName,
    getLicenseState,
    getTrialDaysRemaining,
    isLicenseApiConfigured,
    validateLicense,
} from "../licenseService";

import type {
    LicenseState,
    LicenseStatus,
} from "../types";

interface ActivationLicensingCardProps {
    currentVersion:
    string;
}

function getStatusLabel(
    status:
        LicenseStatus,
): string {
    switch (
    status
    ) {
        case "activated":
            return "Activated";

        case "expired":
            return "Trial Expired";

        case "invalid":
            return "Invalid";

        case "deactivated":
            return "Deactivated";

        case "trial":
        default:
            return "Trial Active";
    }
}

function getStatusClasses(
    status:
        LicenseStatus,
): string {
    switch (
    status
    ) {
        case "activated":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "trial":
            return "border-amber-500/20 bg-amber-500/10 text-amber-400";

        case "expired":
        case "invalid":
            return "border-red-500/20 bg-red-500/10 text-red-400";

        case "deactivated":
        default:
            return "border-zinc-500/20 bg-zinc-500/10 text-zinc-400";
    }
}

export function ActivationLicensingCard({
    currentVersion,
}: ActivationLicensingCardProps) {
    const [
        license,
        setLicense,
    ] =
        useState<LicenseState>(
            () =>
                getLicenseState(),
        );

    const [
        licenseKey,
        setLicenseKey,
    ] =
        useState("");

    const [
        busyAction,
        setBusyAction,
    ] =
        useState<
            | "activate"
            | "validate"
            | "deactivate"
            | null
        >(
            null,
        );

    const [
        errorMessage,
        setErrorMessage,
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

    const trialDaysRemaining =
        getTrialDaysRemaining(
            license,
        );

    const activationConfigured =
        isLicenseApiConfigured();

    async function handleActivate() {
        try {
            setBusyAction(
                "activate",
            );

            setErrorMessage(
                null,
            );

            setStatusMessage(
                null,
            );

            const activated =
                await activateLicense(
                    licenseKey,
                );

            setLicense(
                activated,
            );

            setLicenseKey(
                "",
            );

            setStatusMessage(
                "3D PrintVault was activated successfully.",
            );
        } catch (error) {
            setErrorMessage(
                String(error),
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleValidate() {
        try {
            setBusyAction(
                "validate",
            );

            setErrorMessage(
                null,
            );

            const validated =
                await validateLicense();

            setLicense(
                validated,
            );

            if (
                validated.status ===
                "activated"
            ) {
                setStatusMessage(
                    "License validation completed successfully.",
                );
            } else {
                setStatusMessage(
                    null,
                );

                setErrorMessage(
                    "The current license is no longer valid.",
                );
            }
        } catch (error) {
            setErrorMessage(
                String(error),
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    async function handleDeactivate() {
        const confirmed =
            window.confirm(
                "Deactivate 3D PrintVault on this installation?\n\nPremium features on this Mac will be disabled.",
            );

        if (!confirmed) {
            return;
        }

        try {
            setBusyAction(
                "deactivate",
            );

            setErrorMessage(
                null,
            );

            const deactivated =
                await deactivateLicense();

            setLicense(
                deactivated,
            );

            setStatusMessage(
                "3D PrintVault was deactivated on this installation.",
            );
        } catch (error) {
            setErrorMessage(
                String(error),
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-zinc-500">
                    <FiKey />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-100">
                                Activation & Licensing
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Manage your 3D PrintVault edition, trial, and license activation.
                            </p>
                        </div>

                        <span
                            className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                license.status,
                            )}`}
                        >
                            {
                                getStatusLabel(
                                    license.status,
                                )
                            }
                        </span>
                    </div>

                    <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-5">
                        <div className="flex items-start justify-between gap-5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                    Edition
                                </p>

                                <h4 className="mt-2 text-lg font-semibold text-zinc-100">
                                    {
                                        getEditionDisplayName(
                                            license.edition,
                                        )
                                    }
                                </h4>

                                {license.status ===
                                    "trial" && (
                                        <p className="mt-2 text-xs text-zinc-500">
                                            {
                                                trialDaysRemaining
                                            }{" "}
                                            {trialDaysRemaining ===
                                                1
                                                ? "day"
                                                : "days"}{" "}
                                            remaining in your trial.
                                        </p>
                                    )}

                                {license.status ===
                                    "expired" && (
                                        <p className="mt-2 text-xs text-red-400">
                                            Your trial period has ended.
                                        </p>
                                    )}

                                {license.status ===
                                    "activated" && (
                                        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                                            <FiCheckCircle />

                                            Paid license active
                                        </p>
                                    )}
                            </div>

                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${license.status ===
                                    "activated"
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                    : "border-white/10 bg-white/[0.03] text-zinc-500"
                                    }`}
                            >
                                {license.status ===
                                    "activated"
                                    ? <FiUnlock />
                                    : <FiLock />}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <LicenseMetric
                            label="Status"
                            value={
                                getStatusLabel(
                                    license.status,
                                )
                            }
                        />

                        <LicenseMetric
                            label="Edition"
                            value={
                                license.edition
                            }
                        />

                        <LicenseMetric
                            label="Version"
                            value={`v${currentVersion}`}
                        />

                        <LicenseMetric
                            label="Installation"
                            value={
                                license.installationId
                                    .slice(
                                        0,
                                        12,
                                    )
                            }
                            icon={
                                <FiMonitor />
                            }
                        />
                    </div>

                    {license.status !==
                        "activated" && (
                            <div className="mt-5 border-t border-white/10 pt-5">
                                <p className="text-xs font-semibold text-zinc-300">
                                    Activate 3D PrintVault
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-600">
                                    Enter the license key associated with your one-time purchase.
                                </p>

                                <div className="mt-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={
                                            licenseKey
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setLicenseKey(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-red-600/60"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleActivate()
                                        }
                                        disabled={
                                            busyAction !==
                                            null ||
                                            !licenseKey
                                                .trim() ||
                                            !activationConfigured
                                        }
                                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {busyAction ===
                                            "activate"
                                            ? "Activating..."
                                            : "Activate License"}
                                    </button>
                                </div>

                                {!activationConfigured && (
                                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-400">
                                        License activation is in development. The activation server has not been connected yet.
                                    </div>
                                )}
                            </div>
                        )}

                    {license.status ===
                        "activated" && (
                            <div className="mt-5 border-t border-white/10 pt-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-zinc-300">
                                            License
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-600">
                                            {
                                                license.licenseKeyMasked ??
                                                "Activated license"
                                            }
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleValidate()
                                            }
                                            disabled={
                                                busyAction !==
                                                null
                                            }
                                            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                                        >
                                            <FiRefreshCw />

                                            Validate
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleDeactivate()
                                            }
                                            disabled={
                                                busyAction !==
                                                null
                                            }
                                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                                        >
                                            Deactivate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    <div className="mt-5 border-t border-white/10 pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium text-zinc-300">
                                    Upgrade 3D PrintVault
                                </p>

                                <p className="mt-1 text-xs text-zinc-600">
                                    Purchase a one-time license to unlock paid features.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled
                                title="Purchase flow will be connected later."
                                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-500 opacity-60"
                            >
                                <FiShoppingBag />

                                Purchase License
                            </button>
                        </div>
                    </div>

                    {statusMessage && (
                        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                            {
                                statusMessage
                            }
                        </div>
                    )}

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
    );
}

interface LicenseMetricProps {
    label:
    string;

    value:
    string;

    icon?:
    ReactNode;
}

function LicenseMetric({
    label,
    value,
    icon,
}: LicenseMetricProps) {
    return (
        <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
            <div className="flex items-center gap-2">
                {icon && (
                    <span className="text-zinc-600">
                        {
                            icon
                        }
                    </span>
                )}

                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {
                        label
                    }
                </p>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-zinc-200">
                {
                    value
                }
            </p>
        </div>
    );
}