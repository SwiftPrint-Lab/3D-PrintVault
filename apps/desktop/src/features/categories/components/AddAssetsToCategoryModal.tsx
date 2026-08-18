import {
    useMemo,
    useState,
} from "react";

import {
    FiCheck,
    FiSearch,
    FiX,
} from "react-icons/fi";

import type {
    Asset,
} from "../../library/types/asset";

import type {
    Category,
} from "../../../services/databaseService";

interface AddAssetsToCategoryModalProps {
    category: Category;

    assets: Asset[];

    existingAssetIds: Set<number>;

    onClose: () => void;

    onAddAssets: (
        assetIds: number[],
    ) => Promise<void>;
}

export function AddAssetsToCategoryModal({
    category,
    assets,
    existingAssetIds,
    onClose,
    onAddAssets,
}: AddAssetsToCategoryModalProps) {
    const [
        search,
        setSearch,
    ] = useState("");

    const [
        selectedIds,
        setSelectedIds,
    ] = useState<Set<number>>(
        new Set(),
    );

    const [
        saving,
        setSaving,
    ] = useState(false);

    const filteredAssets =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return assets;
            }

            return assets.filter(
                (asset) =>
                    asset.name
                        .toLowerCase()
                        .includes(
                            query,
                        ) ||
                    asset.extension
                        .toLowerCase()
                        .includes(
                            query,
                        ) ||
                    asset.technology
                        .toLowerCase()
                        .includes(
                            query,
                        ),
            );
        }, [
            assets,
            search,
        ]);

    const selectableAssets =
        filteredAssets.filter(
            (asset) =>
                !existingAssetIds.has(
                    asset.id,
                ),
        );

    function toggleAsset(
        assetId: number,
    ) {
        if (
            existingAssetIds.has(
                assetId,
            )
        ) {
            return;
        }

        setSelectedIds(
            (current) => {
                const updated =
                    new Set(
                        current,
                    );

                if (
                    updated.has(
                        assetId,
                    )
                ) {
                    updated.delete(
                        assetId,
                    );
                } else {
                    updated.add(
                        assetId,
                    );
                }

                return updated;
            },
        );
    }

    function handleSelectAll() {
        setSelectedIds(
            new Set(
                selectableAssets.map(
                    (asset) =>
                        asset.id,
                ),
            ),
        );
    }

    function handleClearSelection() {
        setSelectedIds(
            new Set(),
        );
    }

    async function handleAdd() {
        if (
            selectedIds.size ===
            0
        ) {
            return;
        }

        try {
            setSaving(true);

            await onAddAssets(
                Array.from(
                    selectedIds,
                ),
            );

            onClose();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
            <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                {/* HEADER */}

                <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">
                            Add Assets
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                            Add Library assets to{" "}
                            <span className="text-zinc-300">
                                {
                                    category.name
                                }
                            </span>
                            .
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
                            placeholder="Search Library assets..."
                            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-zinc-500">
                            {
                                selectedIds.size
                            }{" "}
                            selected
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={
                                    handleSelectAll
                                }
                                className="text-xs text-zinc-400 transition hover:text-white"
                            >
                                Select All
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleClearSelection
                                }
                                className="text-xs text-zinc-400 transition hover:text-white"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* ASSET LIST */}

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {filteredAssets.length ===
                    0 ? (
                        <div className="flex min-h-[240px] items-center justify-center text-sm text-zinc-500">
                            No matching assets.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAssets.map(
                                (
                                    asset,
                                ) => {
                                    const alreadyAdded =
                                        existingAssetIds.has(
                                            asset.id,
                                        );

                                    const selected =
                                        selectedIds.has(
                                            asset.id,
                                        );

                                    return (
                                        <button
                                            key={
                                                asset.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                toggleAsset(
                                                    asset.id,
                                                )
                                            }
                                            disabled={
                                                alreadyAdded ||
                                                saving
                                            }
                                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                                alreadyAdded
                                                    ? "cursor-not-allowed border-white/5 bg-white/[0.015] opacity-45"
                                                    : selected
                                                      ? "border-red-500/50 bg-red-500/10"
                                                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                    selected
                                                        ? "border-red-500 bg-red-600 text-white"
                                                        : "border-white/20 bg-zinc-900 text-transparent"
                                                }`}
                                            >
                                                <FiCheck className="text-xs" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-zinc-200">
                                                    {
                                                        asset.name
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {
                                                        asset.extension
                                                    }
                                                    {" · "}
                                                    {
                                                        asset.technology
                                                    }
                                                    {" · "}
                                                    {
                                                        asset.size
                                                    }
                                                </p>
                                            </div>

                                            {alreadyAdded && (
                                                <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-500">
                                                    Already Added
                                                </span>
                                            )}
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
                        Adding assets does not move or modify the original files.
                    </p>

                    <div className="flex items-center gap-2">
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
                                void handleAdd()
                            }
                            disabled={
                                selectedIds.size ===
                                    0 ||
                                saving
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving
                                ? "Adding..."
                                : selectedIds.size ===
                                    1
                                  ? "Add 1 Asset"
                                  : `Add ${selectedIds.size} Assets`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}