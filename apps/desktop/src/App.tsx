import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { AppShell } from "./components/layout/AppShell";
import { InspectorPanel } from "./features/library/components/InspectorPanel";
import { LibraryPage } from "./features/library/components/LibraryPage";
import type { Asset } from "./features/library/types/asset";
import { selectAssetsForImport } from "./services/importService";
import { loadAssets, saveAssets } from "./services/databaseService";
import { EmptyLibraryState } from "./features/library/components/EmptyLibraryState";

function App() {
  const [activeSection, setActiveSection] =
    useState("Library");

  const [viewMode, setViewMode] =
    useState<"grid" | "list">("grid");

  const [search, setSearch] = useState("");

  const [assets, setAssets] =
    useState<Asset[]>([]);

  const [selectedAsset, setSelectedAsset] =
    useState<Asset | null>(null);

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

  useEffect(() => {
    async function initializeLibrary() {
      try {
        const savedAssets = await loadAssets();

        setAssets(savedAssets);

        if (savedAssets.length > 0) {
          setSelectedAsset(savedAssets[0]);
        } else {
          setSelectedAsset(null);
        }
      } catch (error) {
        console.error(
          "Failed to load database:",
          error,
        );

        setAssets([]);
        setSelectedAsset(null);
      }
    }

    initializeLibrary();
  }, []);

  async function handleImport() {
    console.log("Import button clicked");

    try {
      const importedAssets =
        await selectAssetsForImport();

      console.log(
        "Selected assets:",
        importedAssets,
      );

      if (importedAssets.length === 0) {
        return;
      }

      // Save imported assets to SQLite.
      await saveAssets(importedAssets);

      // Update the visible Library.
      setAssets((currentAssets) => [
        ...importedAssets,
        ...currentAssets,
      ]);

      // Automatically select the first imported asset.
      setSelectedAsset(importedAssets[0]);
    } catch (error) {
      console.error(
        "Failed to import assets:",
        error,
      );

      alert(
        `Import failed: ${String(error)}`,
      );
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
        {selectedAsset ? (
          <>
            <LibraryPage
              assets={filteredAssets}
              selectedAsset={selectedAsset}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onAssetSelect={setSelectedAsset}
            />

            <InspectorPanel
              asset={selectedAsset}
            />
          </>
        ) : (
          <EmptyLibraryState
            onImport={handleImport}
          />
        )}
      </div>
    </AppShell>
  );
}

export default App;