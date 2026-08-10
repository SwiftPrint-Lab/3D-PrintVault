import { AssetPreview } from "./AssetPreview";
import type { Asset } from "../types/asset";

interface AssetCardProps {
    asset: Asset;
    selected: boolean;
    onSelect: (asset: Asset) => void;
}

export function AssetCard({
    asset,
    selected,
    onSelect,
}: AssetCardProps) {
    return (
        <button
            onClick={() => onSelect(asset)}
            className={`group overflow-hidden rounded-xl border text-left transition ${selected
                ? "border-red-600/80 bg-red-950/10"
                : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
        >
            <div className="flex aspect-[4/3] items-center justify-center border-b border-white/10 bg-zinc-900">
                <AssetPreview asset={asset} selected={selected} />
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                            {asset.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                            {asset.extension} • {asset.size}
                        </p>
                    </div>

                    <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-zinc-500">
                        {asset.technology}
                    </span>
                </div>
            </div>
        </button>
    );
}
