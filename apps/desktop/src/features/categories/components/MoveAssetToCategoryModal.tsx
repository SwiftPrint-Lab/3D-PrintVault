import {
    useMemo,
    useState,
} from "react";

import {
    FiCheck,
    FiFolder,
    FiSearch,
    FiX,
} from "react-icons/fi";

import type {
    Asset,
} from "../../library/types/asset";

import type {
    Category,
} from "../../../services/databaseService";

type CategoryTransferMode =
    | "add"
    | "move";

interface MoveAssetToCategoryModalProps {
    asset: Asset;

    currentCategory: Category;

    categories: Category[];

    onClose: () => void;

    onTransfer: (
        destinationCategory: Category,
        mode: CategoryTransferMode,
    ) => Promise<void>;
}

export function MoveAssetToCategoryModal({
    asset,
    currentCategory,
    categories,
    onClose,
    onTransfer,
}: MoveAssetToCategoryModalProps) {
    const [
        search,
        setSearch,
    ] = useState("");

    const [
        selectedCategoryId,
        setSelectedCategoryId,
    ] = useState<number | null>(
        null,
    );

    const [
        mode,
        setMode,
    ] = useState<CategoryTransferMode>(
        "add",
    );

    const [
        saving,
        setSaving,
    ] = useState(false);

    const availableCategories =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return categories.filter(
                (category) => {
                    if (
                        category.id ===
                        currentCategory.id
                    ) {
                        return false;
                    }

                    if (!query) {
                        return true;
                    }

                    return category.name
                        .toLowerCase()
                        .includes(
                            query,
                        );
                },
            );
        }, [
            categories,
            currentCategory.id,
            search,
        ]);

    const selectedCategory =
        categories.find(
            (category) =>
                category.id ===
                selectedCategoryId,
        ) ?? null;

    async function handleTransfer() {
        if (
            !selectedCategory
        ) {
            return;
        }

        try {
            setSaving(true);

            await onTransfer(
                selectedCategory,
                mode,
            );

            onClose();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
            <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                {/* HEADER */}

                <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">
                            Organize Asset
                        </h2>

                        <p className="mt-1 max-w-lg truncate text-xs text-zinc-500">
                            {
                                asset.name
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            saving
                        }
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                        aria-label="Close"
                    >
                        <FiX />
                    </button>
                </div>

                {/* MODE */}

                <div className="border-b border-white/10 p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Action
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() =>
                                setMode(
                                    "add",
                                )
                            }
                            className={`rounded-xl border p-4 text-left transition ${mode ===
                                    "add"
                                    ? "border-red-500/50 bg-red-500/10"
                                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                                }`}
                        >
                            <p className="text-sm font-medium text-zinc-100">
                                Add to Folder
                            </p>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Keep the asset in{" "}
                                <span className="text-zinc-300">
                                    {
                                        currentCategory.name
                                    }
                                </span>{" "}
                                and also add it to another folder.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setMode(
                                    "move",
                                )
                            }
                            className={`rounded-xl border p-4 text-left transition ${mode ===
                                    "move"
                                    ? "border-red-500/50 bg-red-500/10"
                                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                                }`}
                        >
                            <p className="text-sm font-medium text-zinc-100">
                                Move to Folder
                            </p>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Add the asset to another folder and remove it from{" "}
                                <span className="text-zinc-300">
                                    {
                                        currentCategory.name
                                    }
                                </span>
                                .
                            </p>
                        </button>
                    </div>
                </div>

                {/* SEARCH */}

                <div className="border-b border-white/10 p-4">
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3">
                        <FiSearch className="shrink-0 text-zinc-600" />

                        <input
                            value={
                                search
                            }
                            onChange={(
                                event,
                            ) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="Search folders..."
                            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                {/* CATEGORY LIST */}

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {availableCategories.length ===
                        0 ? (
                        <div className="flex min-h-[220px] items-center justify-center text-sm text-zinc-500">
                            No available folders.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableCategories.map(
                                (
                                    category,
                                ) => {
                                    const selected =
                                        category.id ===
                                        selectedCategoryId;

                                    return (
                                        <button
                                            key={
                                                category.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSelectedCategoryId(
                                                    category.id,
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected
                                                    ? "border-red-500/50 bg-red-500/10"
                                                    : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${selected
                                                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                                                        : "border-white/10 bg-zinc-900 text-zinc-500"
                                                    }`}
                                            >
                                                {selected ? (
                                                    <FiCheck />
                                                ) : (
                                                    <FiFolder />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-zinc-200">
                                                    {
                                                        category.name
                                                    }
                                                </p>

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
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}

                <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                    <p className="text-xs text-zinc-500">
                        The original file will not be moved or modified.
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                saving
                            }
                            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void handleTransfer()
                            }
                            disabled={
                                !selectedCategory ||
                                saving
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving
                                ? "Saving..."
                                : mode ===
                                    "move"
                                    ? "Move Asset"
                                    : "Add Asset"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
