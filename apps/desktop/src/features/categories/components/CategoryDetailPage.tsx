import {
    useState,
} from "react";

import {
    FiFolder,
    FiPlus,
    FiX,
} from "react-icons/fi";
import type {
    Asset,
} from "../../library/types/asset";

import type {
    Category,
} from "../../../services/databaseService";

interface CategoryDetailPageProps {
    category: Category;

    childCategories:
    Category[];

    assets:
    Asset[];

    onBack: () => void;

    onOpenCategory: (
        category: Category,
    ) => void;

    onCreateChildCategory: (
        name: string,
    ) => Promise<Category | null>;

    onAddAssets: () => void;

    onRemoveAsset: (
        asset: Asset,
    ) => Promise<void>;

    onOrganizeAsset: (
        asset: Asset,
    ) => void;
}

export function CategoryDetailPage({
    category,
    childCategories,
    assets,
    onBack,
    onOpenCategory,
    onCreateChildCategory,
    onAddAssets,
    onRemoveAsset,
    onOrganizeAsset,
}: CategoryDetailPageProps) {
    const [
        creatingFolder,
        setCreatingFolder,
    ] = useState(false);

    const [
        folderName,
        setFolderName,
    ] = useState("");

    const [
        creating,
        setCreating,
    ] = useState(false);

    async function handleCreateChildCategory() {
        const trimmedName =
            folderName.trim();

        if (!trimmedName) {
            return;
        }

        try {
            setCreating(true);

            const createdCategory =
                await onCreateChildCategory(
                    trimmedName,
                );

            if (!createdCategory) {
                return;
            }

            setFolderName("");
            setCreatingFolder(false);
        } finally {
            setCreating(false);
        }
    }

    function handleCancelCreateFolder() {
        setFolderName("");
        setCreatingFolder(false);
    }

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* --------------------------------------------------
             * HEADER
             * -------------------------------------------------- */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <button
                        type="button"
                        onClick={
                            onBack
                        }
                        className="text-xs text-zinc-400 transition hover:text-white"
                    >
                        ← Categories
                    </button>

                    <div className="mt-2">
                        <h2 className="text-sm font-semibold text-zinc-100">
                            {
                                category.name
                            }
                        </h2>

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
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            setCreatingFolder(
                                true,
                            )
                        }
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white"
                    >
                        <FiPlus />

                        New Folder
                    </button>

                    <button
                        type="button"
                        onClick={
                            onAddAssets
                        }
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                    >
                        <FiPlus />

                        Add Assets
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {/* --------------------------------------------------
                 * CREATE CHILD FOLDER
                 * -------------------------------------------------- */}

                {creatingFolder && (
                    <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="mb-1 text-xs font-medium text-zinc-300">
                            New Folder
                        </p>

                        <p className="mb-3 text-xs text-zinc-600">
                            Create a folder inside{" "}
                            <span className="text-zinc-400">
                                {
                                    category.name
                                }
                            </span>
                            .
                        </p>

                        <div className="flex gap-2">
                            <input
                                autoFocus
                                value={
                                    folderName
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setFolderName(
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
                                        void handleCreateChildCategory();
                                    }

                                    if (
                                        event.key ===
                                        "Escape"
                                    ) {
                                        handleCancelCreateFolder();
                                    }
                                }}
                                placeholder="Folder name"
                                disabled={
                                    creating
                                }
                                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60 disabled:opacity-50"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    void handleCreateChildCategory()
                                }
                                disabled={
                                    !folderName.trim() ||
                                    creating
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {creating
                                    ? "Creating..."
                                    : "Create"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleCancelCreateFolder
                                }
                                disabled={
                                    creating
                                }
                                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------
                 * CHILD FOLDERS
                 * -------------------------------------------------- */}

                {childCategories.length >
                    0 && (
                        <div className="mb-8">
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                                Folders
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {childCategories.map(
                                    (
                                        child,
                                    ) => (
                                        <button
                                            key={
                                                child.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                onOpenCategory(
                                                    child,
                                                )
                                            }
                                            className="rounded-xl border border-white/10 bg-white/[0.025] p-5 text-left transition hover:border-red-500/30 hover:bg-white/[0.04]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-lg text-zinc-400">
                                                    <FiFolder />
                                                </div>

                                                <div className="min-w-0">
                                                    <h4 className="truncate text-sm font-semibold text-zinc-100">
                                                        {
                                                            child.name
                                                        }
                                                    </h4>

                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        {
                                                            child.assetCount
                                                        }{" "}
                                                        {child.assetCount ===
                                                            1
                                                            ? "asset"
                                                            : "assets"}
                                                        {" · "}
                                                        {
                                                            child.childCount
                                                        }{" "}
                                                        {child.childCount ===
                                                            1
                                                            ? "folder"
                                                            : "folders"}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                {/* --------------------------------------------------
                 * ASSETS
                 * -------------------------------------------------- */}

                <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Assets
                    </h3>

                    {assets.length ===
                        0 ? (
                        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015]">
                            <div className="max-w-sm text-center">
                                <p className="text-sm font-medium text-zinc-300">
                                    No assets in this folder
                                </p>

                                <p className="mt-2 text-xs leading-5 text-zinc-500">
                                    Add existing Library assets to organize them here.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        onAddAssets
                                    }
                                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                                >
                                    Add Assets
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {assets.map(
                                (
                                    asset,
                                ) => (
                                    <div
                                        key={
                                            asset.id
                                        }
                                        className="group rounded-xl border border-white/10 bg-white/[0.025] p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="truncate text-sm font-medium text-zinc-100">
                                                    {
                                                        asset.name
                                                    }
                                                </h4>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {
                                                        asset.extension
                                                    }
                                                    {" · "}
                                                    {
                                                        asset.size
                                                    }
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onOrganizeAsset(
                                                            asset,
                                                        )
                                                    }
                                                    className="rounded-md px-2 py-1.5 text-[10px] font-medium text-zinc-500 transition hover:bg-white/5 hover:text-white"
                                                    title="Add or move to another folder"
                                                >
                                                    Organize
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void onRemoveAsset(
                                                            asset,
                                                        )
                                                    }
                                                    className="rounded-md p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
                                                    title="Remove from folder"
                                                    aria-label={`Remove ${asset.name} from folder`}
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}