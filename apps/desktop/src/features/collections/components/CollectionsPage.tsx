import {
    useEffect,
    useState,
} from "react";

import {
    FiEdit2,
    FiFile,
    FiFolder,
    FiPlus,
    FiTrash2,
} from "react-icons/fi";

import {
    convertFileSrc,
} from "@tauri-apps/api/core";

import type {
    Collection,
    CollectionPreviewAsset,
} from "../../../services/databaseService";

import {
    loadCollectionPreviewAssets,
} from "../../../services/databaseService";

interface CollectionsPageProps {
    collections: Collection[];

    onCreateCollection: (
        name: string,
    ) => Promise<Collection | null>;

    onRenameCollection: (
        collection: Collection,
        name: string,
    ) => Promise<void>;

    onDeleteCollection: (
        collection: Collection,
    ) => Promise<void>;

    onOpenCollection: (
        collection: Collection,
    ) => void;
}

export function CollectionsPage({
    collections,
    onCreateCollection,
    onRenameCollection,
    onDeleteCollection,
    onOpenCollection,
}: CollectionsPageProps) {
    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        name,
        setName,
    ] = useState("");

    const [
        editingCollectionId,
        setEditingCollectionId,
    ] = useState<number | null>(
        null,
    );

    const [
        editingName,
        setEditingName,
    ] = useState("");

    const [
        previews,
        setPreviews,
    ] = useState<
        Record<
            number,
            CollectionPreviewAsset[]
        >
    >({});

    useEffect(() => {
        let cancelled = false;

        async function loadPreviews() {
            const nextPreviews: Record<
                number,
                CollectionPreviewAsset[]
            > = {};

            await Promise.all(
                collections.map(
                    async (
                        collection,
                    ) => {
                        try {
                            const assets =
                                await loadCollectionPreviewAssets(
                                    collection.id,
                                    4,
                                );

                            nextPreviews[
                                collection.id
                            ] = assets;
                        } catch (error) {
                            console.error(
                                `Failed to load preview for collection ${collection.id}:`,
                                error,
                            );

                            nextPreviews[
                                collection.id
                            ] = [];
                        }
                    },
                ),
            );

            if (!cancelled) {
                setPreviews(
                    nextPreviews,
                );
            }
        }

        void loadPreviews();

        return () => {
            cancelled = true;
        };
    }, [collections]);

    async function handleCreate() {
        const trimmed =
            name.trim();

        if (!trimmed) {
            return;
        }

        const collection =
            await onCreateCollection(
                trimmed,
            );

        if (!collection) {
            return;
        }

        setName("");
        setCreating(false);
    }

    function beginRename(
        collection: Collection,
    ) {
        setEditingCollectionId(
            collection.id,
        );

        setEditingName(
            collection.name,
        );
    }

    function cancelRename() {
        setEditingCollectionId(
            null,
        );

        setEditingName("");
    }

    async function handleRename(
        collection: Collection,
    ) {
        const trimmed =
            editingName.trim();

        if (!trimmed) {
            return;
        }

        if (
            trimmed ===
            collection.name
        ) {
            cancelRename();
            return;
        }

        await onRenameCollection(
            collection,
            trimmed,
        );

        cancelRename();
    }

    return (
        <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Collections
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Organize assets without duplicating files.
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
                    New Collection
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {creating && (
                    <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="mb-3 text-xs font-medium text-zinc-300">
                            Create Collection
                        </p>

                        <div className="flex gap-2">
                            <input
                                autoFocus
                                value={name}
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
                                placeholder="Collection name"
                                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    void handleCreate()
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
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

                {collections.length ===
                    0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="max-w-sm text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl text-zinc-500">
                                <FiFolder />
                            </div>

                            <h3 className="text-base font-semibold text-zinc-200">
                                No collections yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Create collections to group related models,
                                projects, customer files, or printer parts.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                        {collections.map(
                            (
                                collection,
                            ) => {
                                const editing =
                                    editingCollectionId ===
                                    collection.id;

                                const collectionPreviews =
                                    previews[
                                    collection.id
                                    ] ?? [];

                                return (
                                    <div
                                        key={
                                            collection.id
                                        }
                                        className="group rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onOpenCollection(
                                                    collection,
                                                )
                                            }
                                            disabled={
                                                editing
                                            }
                                            className="w-full text-left disabled:cursor-default"
                                        >
                                            <CollectionPreview
                                                assets={
                                                    collectionPreviews
                                                }
                                            />
                                        </button>

                                        <div className="mt-4">
                                            {editing ? (
                                                <div>
                                                    <input
                                                        autoFocus
                                                        value={
                                                            editingName
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setEditingName(
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        onKeyDown={(
                                                            event,
                                                        ) => {
                                                            if (
                                                                event.key ===
                                                                "Enter"
                                                            ) {
                                                                void handleRename(
                                                                    collection,
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
                                                                    collection,
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
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onOpenCollection(
                                                                collection,
                                                            )
                                                        }
                                                        className="block w-full text-left"
                                                    >
                                                        <p className="truncate text-sm font-medium text-zinc-200">
                                                            {
                                                                collection.name
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-zinc-500">
                                                            {
                                                                collection.assetCount ??
                                                                0
                                                            }{" "}
                                                            {collection.assetCount ===
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
                                                                    collection,
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
                                                                void onDeleteCollection(
                                                                    collection,
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

interface CollectionPreviewProps {
    assets:
    CollectionPreviewAsset[];
}

function CollectionPreview({
    assets,
}: CollectionPreviewProps) {
    if (
        assets.length ===
        0
    ) {
        return (
            <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-900 text-4xl text-zinc-600">
                <FiFolder />
            </div>
        );
    }

    if (
        assets.length ===
        1
    ) {
        return (
            <div className="h-32 overflow-hidden rounded-lg bg-zinc-900">
                <PreviewAsset
                    asset={
                        assets[0]
                    }
                />
            </div>
        );
    }

    return (
        <div className="grid h-32 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg bg-zinc-900 p-1">
            {assets
                .slice(
                    0,
                    4,
                )
                .map(
                    (
                        asset,
                    ) => (
                        <div
                            key={
                                asset.id
                            }
                            className="min-h-0 overflow-hidden rounded-md bg-zinc-950"
                        >
                            <PreviewAsset
                                asset={
                                    asset
                                }
                            />
                        </div>
                    ),
                )}

            {Array.from({
                length:
                    Math.max(
                        0,
                        4 -
                        assets.length,
                    ),
            }).map(
                (
                    _,
                    index,
                ) => (
                    <div
                        key={`empty-${index}`}
                        className="flex items-center justify-center rounded-md bg-zinc-950 text-zinc-800"
                    >
                        <FiFolder />
                    </div>
                ),
            )}
        </div>
    );
}

interface PreviewAssetProps {
    asset:
    CollectionPreviewAsset;
}

function PreviewAsset({
    asset,
}: PreviewAssetProps) {
    if (
        asset.thumbnailPath
    ) {
        return (
            <img
                src={convertFileSrc(
                    asset.thumbnailPath,
                )}
                alt={
                    asset.name
                }
                className="h-full w-full object-cover"
            />
        );
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-900 text-zinc-600">
            <FiFile className="text-xl" />

            <span className="max-w-[90%] truncate text-[9px] uppercase tracking-wide">
                {asset.extension}
            </span>
        </div>
    );
}