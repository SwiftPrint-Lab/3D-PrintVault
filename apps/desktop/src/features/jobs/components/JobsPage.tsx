import {
    useState,
} from "react";

import type {
    Job,
    JobStatus,
} from "../../../services/databaseService";

interface JobsPageProps {
    jobs: Job[];

    onCreateJob: (
        name: string,
    ) => Promise<Job | null>;

    onDeleteJob: (
        job: Job,
    ) => Promise<void>;

    onOpenJob: (
        job: Job,
    ) => void;
}

function getJobStatusClasses(
    status: JobStatus,
) {
    switch (status) {
        case "Queued":
            return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";

        case "Preparing":
            return "border-amber-500/20 bg-amber-500/10 text-amber-400";

        case "Printing":
            return "border-blue-500/20 bg-blue-500/10 text-blue-400";

        case "Paused":
            return "border-orange-500/20 bg-orange-500/10 text-orange-400";

        case "Completed":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "Failed":
            return "border-red-500/20 bg-red-500/10 text-red-400";

        case "Cancelled":
            return "border-zinc-600/20 bg-zinc-600/10 text-zinc-500";

        default:
            return "border-white/10 bg-white/[0.03] text-zinc-400";
    }
}

export function JobsPage({
    jobs,
    onCreateJob,
    onDeleteJob,
    onOpenJob,
}: JobsPageProps) {
    const [
        creatingJob,
        setCreatingJob,
    ] = useState(false);

    const [
        name,
        setName,
    ] = useState("");

    const [
        saving,
        setSaving,
    ] = useState(false);

    function closeCreateModal() {
        setCreatingJob(false);
        setName("");
    }

    async function handleCreate() {
        const trimmedName =
            name.trim();

        if (!trimmedName) {
            return;
        }

        try {
            setSaving(true);

            const job =
                await onCreateJob(
                    trimmedName,
                );

            if (job) {
                closeCreateModal();
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Jobs
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Manage fabrication and print jobs.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setCreatingJob(true)
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                >
                    + New Job
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {jobs.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="max-w-md text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500">
                                ▣
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-zinc-100">
                                No jobs yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Create a fabrication job and assign assets, machines, and materials.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setCreatingJob(true)
                                }
                                className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                            >
                                + New Job
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        {jobs.map(
                            (job) => (
                                <div
                                    key={job.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                        onOpenJob(job)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();
                                            onOpenJob(job);
                                        }
                                    }}
                                    className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-red-500/30 hover:bg-white/[0.04]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-zinc-100">
                                                {job.name}
                                            </h3>

                                            <p className="mt-1 text-xs text-zinc-500">
                                                Quantity: {job.quantity}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-medium ${getJobStatusClasses(
                                                job.status,
                                            )}`}
                                        >
                                            {job.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-zinc-500">
                                                Asset
                                            </span>

                                            <span className="text-zinc-300">
                                                {job.assetId
                                                    ? `Asset #${job.assetId}`
                                                    : "Not assigned"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-zinc-500">
                                                Machine
                                            </span>

                                            <span className="text-zinc-300">
                                                {job.machineId
                                                    ? `Machine #${job.machineId}`
                                                    : "Not assigned"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-zinc-500">
                                                Material
                                            </span>

                                            <span className="text-zinc-300">
                                                {job.materialId
                                                    ? `Material #${job.materialId}`
                                                    : "Not assigned"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();

                                                void onDeleteJob(
                                                    job,
                                                );
                                            }}
                                            className="text-xs text-red-400 transition hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>

            {creatingJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
                    <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">
                                    New Job
                                </h3>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Create a fabrication job in PrintVault.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeCreateModal
                                }
                                className="text-xl leading-none text-zinc-500 transition hover:text-white"
                                aria-label="Close create job"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-5">
                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Job Name
                                </span>

                                <input
                                    autoFocus
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Alabama Light Box Print"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeCreateModal
                                }
                                disabled={saving}
                                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleCreate()
                                }
                                disabled={
                                    saving ||
                                    !name.trim()
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {saving
                                    ? "Creating..."
                                    : "Create Job"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}