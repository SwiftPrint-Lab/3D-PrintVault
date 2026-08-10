import { FiBox, FiDatabase } from "react-icons/fi";
import type { Asset } from "../types/asset";
import { OpenInMenu } from "./OpenInMenu";

interface InspectorPanelProps {
    asset: Asset;
}

export function InspectorPanel({
    asset,
}: InspectorPanelProps) {
    return (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-zinc-950">
            <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Inspector
                </p>
            </div>

            <div className="overflow-y-auto p-5">
                <div className="mb-5 flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-zinc-900">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-zinc-800 text-5xl text-red-500/70">
                        <FiBox />
                    </div>
                </div>

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
                        value={asset.technology}
                    />

                    <InspectorRow
                        label="File Type"
                        value={asset.extension}
                    />

                    <InspectorRow
                        label="File Size"
                        value={asset.size}
                    />

                    <InspectorRow
                        label="Modified"
                        value={asset.modified}
                    />
                </div>

                <div className="my-5 border-t border-white/10" />

                <OpenInMenu />

                <div className="my-5 border-t border-white/10" />

                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white">
                    <FiDatabase />
                    Reveal in Finder
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
