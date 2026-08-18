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
    Category,
} from "../../../services/databaseService";

interface CategoriesPageProps {
    categories: Category[];

    onCreateCategory: (
        name: string,
    ) => Promise<Category | null>;

    onRenameCategory: (
        category: Category,
        name: string,
    ) => Promise<void>;

    onDeleteCategory: (
        category: Category,
    ) => Promise<void>;

    onOpenCategory: (
        category: Category,
    ) => void;
}

export function CategoriesPage({
    categories,
    onCreateCategory,
    onRenameCategory,
    onDeleteCategory,
    onOpenCategory,
}: CategoriesPageProps) {
    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        name,
        setName,
    ] = useState("");

    const [
        editingCategoryId,
        setEditingCategoryId,
    ] = useState<number | null>(
        null,
    );

    const [
        editingName,
        setEditingName,
    ] = useState("");

    async function handleCreate() {
        const trimmed =
            name.trim();

        if (!trimmed) {
            return;
        }

        const category =
            await onCreateCategory(
                trimmed,
            );

        if (!category) {
            return;
        }

        setName("");
        setCreating(false);
    }

    function beginRename(
        category: Category,
    ) {
        setEditingCategoryId(
            category.id,
        );

        setEditingName(
            category.name,
        );
    }

    function cancelRename() {
        setEditingCategoryId(
            null,
        );

        setEditingName("");
    }

    async function handleRename(
        category: Category,
    ) {
        const trimmed =
            editingName.trim();

        if (!trimmed) {
            return;
        }

        if (
            trimmed ===
            category.name
        ) {
            cancelRename();
            return;
        }

        await onRenameCategory(
            category,
            trimmed,
        );

        cancelRename();
    }

    return (
        <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Categories
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Organize assets into virtual folders without moving the original files.
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

                    New Folder
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {creating && (
                    <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="mb-3 text-xs font-medium text-zinc-300">
                            Create Folder
                        </p>

                        <div className="flex gap-2">
                            <input
                                autoFocus
                                value={
                                    name
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        void handleCreate();
                                    }

                                    if (
                                        event.key ===
                                        "Escape"
                                    ) {
                                        setCreating(
                                            false,
                                        );

                                        setName("");
                                    }
                                }}
                                placeholder="Folder name"
                                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    void handleCreate()
                                }
                                disabled={
                                    !name.trim()
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Create
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setCreating(
                                        false,
                                    );

                                    setName("");
                                }}
                                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {categories.length ===
                    0 ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                        <div className="max-w-md text-center">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl text-zinc-500">
                                <FiFolder />
                            </div>

                            <h3 className="text-base font-semibold text-zinc-100">
                                No categories yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Create virtual folders to organize your 3D PrintVault assets.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setCreating(true)
                                }
                                className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                            >
                                Create First Folder
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {categories.map(
                            (category) => {
                                const editing =
                                    editingCategoryId ===
                                    category.id;

                                return (
                                    <div
                                        key={
                                            category.id
                                        }
                                        className="group rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-red-500/30 hover:bg-white/[0.04]"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onOpenCategory(
                                                        category,
                                                    )
                                                }
                                                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-lg text-zinc-400">
                                                    <FiFolder />
                                                </div>

                                                <div className="min-w-0">
                                                    {editing ? (
                                                        <input
                                                            autoFocus
                                                            value={
                                                                editingName
                                                            }
                                                            onClick={(
                                                                event,
                                                            ) =>
                                                                event.stopPropagation()
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                setEditingName(
                                                                    event.target.value,
                                                                )
                                                            }
                                                            onKeyDown={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();

                                                                if (
                                                                    event.key ===
                                                                    "Enter"
                                                                ) {
                                                                    void handleRename(
                                                                        category,
                                                                    );
                                                                }

                                                                if (
                                                                    event.key ===
                                                                    "Escape"
                                                                ) {
                                                                    cancelRename();
                                                                }
                                                            }}
                                                            className="w-full rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-sm font-semibold text-zinc-100 outline-none focus:border-red-600/60"
                                                        />
                                                    ) : (
                                                        <h3 className="truncate text-sm font-semibold text-zinc-100">
                                                            {
                                                                category.name
                                                            }
                                                        </h3>
                                                    )}

                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        {
                                                            category.assetCount
                                                        }{" "}
                                                        {category.assetCount ===
                                                            1
                                                            ? "asset"
                                                            : "assets"}
                                                        {" · "}
                                                        {
                                                            category.childCount
                                                        }{" "}
                                                        {category.childCount ===
                                                            1
                                                            ? "folder"
                                                            : "folders"}
                                                    </p>
                                                </div>
                                            </button>

                                            {!editing && (
                                                <div className="flex shrink-0 items-center gap-1 opacity-60 transition group-hover:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            event,
                                                        ) => {
                                                            event.stopPropagation();

                                                            beginRename(
                                                                category,
                                                            );
                                                        }}
                                                        className="rounded-md p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                                                        title="Rename folder"
                                                        aria-label={`Rename ${category.name}`}
                                                    >
                                                        <FiEdit2 />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            event,
                                                        ) => {
                                                            event.stopPropagation();

                                                            void onDeleteCategory(
                                                                category,
                                                            );
                                                        }}
                                                        className="rounded-md p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                                                        title="Delete folder"
                                                        aria-label={`Delete ${category.name}`}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {editing && (
                                            <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancelRename()
                                                    }
                                                    className="rounded-md border border-white/10 px-3 py-1.5 text-[10px] text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleRename(
                                                            category,
                                                        )
                                                    }
                                                    disabled={
                                                        !editingName.trim()
                                                    }
                                                    className="rounded-md bg-red-600 px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
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