import { FiBox } from "react-icons/fi";
import type { Asset } from "../types/asset";
import { AssetCard } from "./AssetCard";

interface AssetGridProps {
    assets: Asset[];
    selectedAsset: Asset;
    viewMode: "grid" | "list";
    onSelect: (asset: Asset) => void;
}

export function AssetGrid({
    assets,
    selectedAsset,
    viewMode,
    onSelect,
}: AssetGridProps) {
    if (viewMode === "list") {
        return (
            <div className="overflow-hidden rounded-xl border border-white/10">
                {assets.map((asset) => (
                    <button
                        key={asset.id}
                        onClick={() => onSelect(asset)}
                        className={`grid w-full grid-cols-[1fr_120px_100px_100px] items-center border-b border-white/10 px-4 py-3 text-left text-sm last:border-b-0 ${selectedAsset.id === asset.id
                                ? "bg-red-950/20"
                                : "hover:bg-white/[0.03]"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <FiBox className="text-zinc-500" />
                            <span>{asset.name}</span>
                        </div>

                        <span className="text-xs text-zinc-500">
                            {asset.technology}
                        </span>

                        <span className="text-xs text-zinc-500">
                            {asset.size}
                        </span>

                        <span className="text-xs text-zinc-500">
                            {asset.modified}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {assets.map((asset) => (
                <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={selectedAsset.id === asset.id}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}
