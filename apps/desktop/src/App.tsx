import { useMemo, useState } from "react";
import "./App.css";

import { AppShell } from "./components/layout/AppShell";
import { InspectorPanel } from "./features/library/components/InspectorPanel";
import { LibraryPage } from "./features/library/components/LibraryPage";
import { sampleAssets } from "./features/library/data";
import type { Asset } from "./features/library/types/asset";
import { selectAssetsForImport } from "./services/importService";

function App() {
  const [activeSection, setActiveSection] = useState("Library");

  const [viewMode, setViewMode] =
    useState<"grid" | "list">("grid");

  const [search, setSearch] = useState("");

  const [assets, setAssets] =
    useState<Asset[]>(sampleAssets);

  const [selectedAsset, setSelectedAsset] =
    useState<Asset>(sampleAssets[0]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) => {
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.extension.toLowerCase().includes(query) ||
        asset.technology.toLowerCase().includes(query)
      );
    });
  }, [assets, search]);

  async function handleImport() {
    console.log("Import button clicked");

    try {
      const importedAssets =
        await selectAssetsForImport();

      console.log("Selected assets:", importedAssets);

      if (importedAssets.length === 0) {
        return;
      }

      setAssets((currentAssets) => [
        ...importedAssets,
        ...currentAssets,
      ]);

      setSelectedAsset(importedAssets[0]);
    } catch (error) {
      console.error("Failed to import assets:", error);
      alert(`Import failed: ${String(error)}`);
    }
  }

  return (
    <AppShell
      activeSection={activeSection}
      search={search}
      onSectionChange={setActiveSection}
      onSearchChange={setSearch}
      onImport={handleImport}
    >
      <div className="flex min-h-0 flex-1">
        <LibraryPage
          assets={filteredAssets}
          selectedAsset={selectedAsset}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAssetSelect={setSelectedAsset}
        />

        <InspectorPanel asset={selectedAsset} />
      </div>
    </AppShell>
  );
}

export default App;
