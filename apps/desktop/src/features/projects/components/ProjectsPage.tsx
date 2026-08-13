import {
    useState,
} from "react";

import {
    FiEdit2,
    FiFolder,
    FiPlus,
    FiTrash2,
} from "react-icons/fi";

import type {
    Project,
    ProjectStatus,
} from "../../../services/databaseService";

interface ProjectsPageProps {
    projects: Project[];

    onCreateProject: (
        name: string,
        description: string,
    ) => Promise<Project | null>;

    onRenameProject: (
        project: Project,
        name: string,
    ) => Promise<void>;

    onDeleteProject: (
        project: Project,
    ) => Promise<void>;

    onOpenProject: (
        project: Project,
    ) => void;
}

const statusStyles: Record<
    ProjectStatus,
    string
> = {
    Planning:
        "border-zinc-700 bg-zinc-900 text-zinc-400",

    "In Progress":
        "border-blue-900/50 bg-blue-950/30 text-blue-300",

    Paused:
        "border-yellow-900/50 bg-yellow-950/30 text-yellow-300",

    Completed:
        "border-green-900/50 bg-green-950/30 text-green-300",

    Archived:
        "border-purple-900/50 bg-purple-950/30 text-purple-300",
};

export function ProjectsPage({
    projects,
    onCreateProject,
    onRenameProject,
    onDeleteProject,
    onOpenProject,
}: ProjectsPageProps) {
    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        name,
        setName,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        editingProjectId,
        setEditingProjectId,
    ] = useState<number | null>(
        null,
    );

    const [
        editingName,
        setEditingName,
    ] = useState("");

    async function handleCreate() {
        const trimmedName =
            name.trim();

        if (!trimmedName) {
            return;
        }

        const project =
            await onCreateProject(
                trimmedName,
                description,
            );

        if (!project) {
            return;
        }

        setName("");
        setDescription("");
        setCreating(false);
    }

    function beginRename(
        project: Project,
    ) {
        setEditingProjectId(
            project.id,
        );

        setEditingName(
            project.name,
        );
    }

    function cancelRename() {
        setEditingProjectId(
            null,
        );

        setEditingName("");
    }

    async function handleRename(
        project: Project,
    ) {
        const trimmedName =
            editingName.trim();

        if (!trimmedName) {
            return;
        }

        if (
            trimmedName ===
            project.name
        ) {
            cancelRename();
            return;
        }

        await onRenameProject(
            project,
            trimmedName,
        );

        cancelRename();
    }

    return (
        <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Projects
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Manage complete 3D printing and fabrication projects.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setCreating(true)
                    }
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                >
                    <FiPlus />
                    New Project
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {creating && (
                    <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="mb-3 text-xs font-medium text-zinc-300">
                            Create Project
                        </p>

                        <div className="space-y-3">
                            <input
                                autoFocus
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key ===
                                        "Escape"
                                    ) {
                                        setCreating(false);
                                        setName("");
                                        setDescription("");
                                    }
                                }}
                                placeholder="Project name"
                                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />

                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Project description (optional)"
                                rows={3}
                                className="w-full resize-none rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreating(false);
                                        setName("");
                                        setDescription("");
                                    }}
                                    className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleCreate()
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                                >
                                    Create Project
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {projects.length ===
                    0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="max-w-sm text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl text-zinc-500">
                                <FiFolder />
                            </div>

                            <h3 className="text-base font-semibold text-zinc-200">
                                No projects yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Create a project to group assets, track progress,
                                assign materials, printers, and production details.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                        {projects.map(
                            (project) => {
                                const editing =
                                    editingProjectId ===
                                    project.id;

                                return (
                                    <div
                                        key={
                                            project.id
                                        }
                                        className="rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                                    >
                                        <button
                                            type="button"
                                            disabled={editing}
                                            onClick={() =>
                                                onOpenProject(
                                                    project,
                                                )
                                            }
                                            className="w-full text-left disabled:cursor-default"
                                        >
                                            <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-900 text-4xl text-zinc-600">
                                                <FiFolder />
                                            </div>
                                        </button>

                                        <div className="mt-4">
                                            {editing ? (
                                                <>
                                                    <input
                                                        autoFocus
                                                        value={
                                                            editingName
                                                        }
                                                        onChange={(event) =>
                                                            setEditingName(
                                                                event.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                "Enter"
                                                            ) {
                                                                void handleRename(
                                                                    project,
                                                                );
                                                            }

                                                            if (
                                                                event.key ===
                                                                "Escape"
                                                            ) {
                                                                cancelRename();
                                                            }
                                                        }}
                                                        className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-red-600/60"
                                                    />

                                                    <div className="mt-2 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleRename(
                                                                    project,
                                                                )
                                                            }
                                                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                                                        >
                                                            Save
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                cancelRename
                                                            }
                                                            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onOpenProject(
                                                                project,
                                                            )
                                                        }
                                                        className="block w-full text-left"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="truncate text-sm font-medium text-zinc-200">
                                                                {project.name}
                                                            </p>

                                                            <span
                                                                className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-medium ${statusStyles[
                                                                    project.status
                                                                    ]
                                                                    }`}
                                                            >
                                                                {project.status}
                                                            </span>
                                                        </div>

                                                        {project.description && (
                                                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
                                                                {
                                                                    project.description
                                                                }
                                                            </p>
                                                        )}

                                                        <p className="mt-2 text-xs text-zinc-500">
                                                            {
                                                                project.assetCount ??
                                                                0
                                                            }{" "}
                                                            {project.assetCount ===
                                                                1
                                                                ? "asset"
                                                                : "assets"}
                                                        </p>
                                                    </button>

                                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                beginRename(
                                                                    project,
                                                                )
                                                            }
                                                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                                        >
                                                            <FiEdit2 />
                                                            Rename
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void onDeleteProject(
                                                                    project,
                                                                )
                                                            }
                                                            className="flex items-center justify-center gap-2 rounded-lg border border-red-900/40 px-3 py-2 text-xs text-red-400 transition hover:bg-red-950/30 hover:text-red-300"
                                                        >
                                                            <FiTrash2 />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}