import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { AppShell } from "./components/layout/AppShell";
import { InspectorPanel } from "./features/library/components/InspectorPanel";
import { LibraryPage } from "./features/library/components/LibraryPage";
import type { Asset } from "./features/library/types/asset";
import { selectAssetsForImport } from "./services/importService";
import { assetExistsByPath, deleteAssetById, loadAssets, saveAssets } from "./services/databaseService";
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

      if (importedAssets.length === 0) {
        return;
      }

      const uniqueAssets: Asset[] = [];

      for (const asset of importedAssets) {
        if (!asset.path) {
          continue;
        }

        const exists = await assetExistsByPath(
          asset.path,
        );

        if (!exists) {
          uniqueAssets.push(asset);
        }
      }

      if (uniqueAssets.length === 0) {
        alert(
          "Those files are already in your 3D PrintVault library.",
        );
        return;
      }

      await saveAssets(uniqueAssets);

      setAssets((currentAssets) => [
        ...uniqueAssets,
        ...currentAssets,
      ]);

      setSelectedAsset(uniqueAssets[0]);
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

  async function handleDeleteAsset(
    asset: Asset,
  ) {
    const confirmed = window.confirm(
      `Remove "${asset.name}" from 3D PrintVault?\n\nThis will not delete the original file from your Mac.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAssetById(asset.id);

      setAssets((currentAssets) => {
        const updatedAssets =
          currentAssets.filter(
            (item) => item.id !== asset.id,
          );

        if (updatedAssets.length > 0) {
          setSelectedAsset(updatedAssets[0]);
        } else {
          setSelectedAsset(null);
        }

        return updatedAssets;
      });
    } catch (error) {
      console.error(
        "Failed to delete asset:",
        error,
      );

      alert(
        `Delete failed: ${String(error)}`,
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
              onDelete={handleDeleteAsset}
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