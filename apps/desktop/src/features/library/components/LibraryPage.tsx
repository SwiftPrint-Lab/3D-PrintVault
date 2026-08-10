import type { Asset } from "../types/asset";
import { AssetGrid } from "./AssetGrid";
import { LibraryToolbar } from "./LibraryToolbar";

interface LibraryPageProps {
    assets: Asset[];
    selectedAsset: Asset;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
    onAssetSelect: (asset: Asset) => void;
}

export function LibraryPage({
    assets,
    selectedAsset,
    viewMode,
    onViewModeChange,
    onAssetSelect,
}: LibraryPageProps) {
    return (
        <section className="flex min-w-0 flex-1 flex-col">
            <LibraryToolbar
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <AssetGrid
                    assets={assets}
                    selectedAsset={selectedAsset}
                    viewMode={viewMode}
                    onSelect={onAssetSelect}
                />
            </div>
        </section>
    );
}
