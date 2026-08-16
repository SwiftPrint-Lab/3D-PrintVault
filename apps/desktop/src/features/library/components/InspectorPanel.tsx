import {
    FiCopy,
    FiDatabase,
    FiExternalLink,
    FiTrash2,
} from "react-icons/fi";

import type { Asset } from "../types/asset";

import { AssetPreview } from "./AssetPreview";
import { OpenInMenu } from "./OpenInMenu";

import {
    copyFilePath,
    openFile,
    revealFileInFinder,
} from "../../../services/localFileIntegrationService";

interface InspectorPanelProps {
    asset: Asset;
    onDelete: (asset: Asset) => void;
}

export function InspectorPanel({
    asset,
    onDelete,
}: InspectorPanelProps) {
    async function handleOpenFile() {
        if (!asset.path) {
            return;
        }

        try {
            await openFile(
                asset.path,
            );
        } catch (error) {
            console.error(
                "Failed to open asset:",
                error,
            );

            alert(
                `Unable to open file: ${String(error)}`,
            );
        }
    }

    async function handleRevealInFinder() {
        if (!asset.path) {
            return;
        }

        try {
            await revealFileInFinder(
                asset.path,
            );
        } catch (error) {
            console.error(
                "Failed to reveal asset in Finder:",
                error,
            );

            alert(
                `Unable to reveal file in Finder: ${String(error)}`,
            );
        }
    }

    async function handleCopyFilePath() {
        if (!asset.path) {
            return;
        }

        try {
            await copyFilePath(
                asset.path,
            );

            alert(
                "File path copied to clipboard.",
            );
        } catch (error) {
            console.error(
                "Failed to copy asset path:",
                error,
            );

            alert(
                `Unable to copy file path: ${String(error)}`,
            );
        }
    }

    return (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-zinc-950">
            <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Inspector
                </p>
            </div>

            <div className="overflow-y-auto p-5">
                {/* ------------------------------------------------
                 * ASSET PREVIEW
                 * ------------------------------------------------ */}

                <div className="mb-5 flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-zinc-900">
                    <AssetPreview
                        asset={asset}
                        selected
                        large
                    />
                </div>

                {/* ------------------------------------------------
                 * ASSET INFORMATION
                 * ------------------------------------------------ */}

                <h3 className="text-base font-semibold">
                    {asset.name}
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                    {asset.extension} file
                </p>

                <div className="my-5 border-t border-white/10" />

                <div className="space-y-4">
                    <InspectorRow
                        label="Technology"
                        value={
                            asset.technology
                        }
                    />

                    <InspectorRow
                        label="File Type"
                        value={
                            asset.extension
                        }
                    />

                    <InspectorRow
                        label="File Size"
                        value={
                            asset.size
                        }
                    />

                    <InspectorRow
                        label="Modified"
                        value={
                            asset.modified
                        }
                    />
                </div>

                {/* ------------------------------------------------
                 * OPEN IN APPLICATION
                 * ------------------------------------------------ */}

                <div className="my-5 border-t border-white/10" />

                <OpenInMenu
                    asset={asset}
                />

                {/* ------------------------------------------------
                 * LOCAL FILE SYSTEM
                 * ------------------------------------------------ */}

                <div className="my-5 border-t border-white/10" />

                <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Local File
                    </p>

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() =>
                                void handleOpenFile()
                            }
                            disabled={
                                !asset.path
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FiExternalLink />

                            Open File
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void handleRevealInFinder()
                            }
                            disabled={
                                !asset.path
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FiDatabase />

                            Reveal in Finder
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void handleCopyFilePath()
                            }
                            disabled={
                                !asset.path
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <FiCopy />

                            Copy File Path
                        </button>
                    </div>
                </div>

                {/* ------------------------------------------------
                 * DELETE
                 * ------------------------------------------------ */}

                <div className="my-5 border-t border-white/10" />

                <button
                    type="button"
                    onClick={() =>
                        onDelete(
                            asset,
                        )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 py-2 text-xs text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                    <FiTrash2 />

                    Delete from Library
                </button>
            </div>
        </aside>
    );
}

function InspectorRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">
                {label}
            </span>

            <span className="text-right text-xs text-zinc-300">
                {value}
            </span>
        </div>
    );
}