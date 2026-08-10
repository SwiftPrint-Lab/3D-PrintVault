import { useMemo, useState } from "react";
import "./App.css";

import { AppShell } from "./components/layout/AppShell";
import { sampleAssets } from "./features/library/data";
import { InspectorPanel } from "./features/library/components/InspectorPanel";
import { LibraryPage } from "./features/library/components/LibraryPage";
import type { Asset } from "./features/library/types/asset";

function App() {
  const [activeSection, setActiveSection] =
    useState("Library");

  const [viewMode, setViewMode] =
    useState<"grid" | "list">("grid");

  const [search, setSearch] = useState("");

  const [selectedAsset, setSelectedAsset] =
    useState<Asset>(sampleAssets[0]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sampleAssets;
    }

    return sampleAssets.filter((asset) => {
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.extension.toLowerCase().includes(query) ||
        asset.technology.toLowerCase().includes(query)
      );
    });
  }, [search]);

  return (
    <AppShell
      activeSection={activeSection}
      search={search}
      onSectionChange={setActiveSection}
      onSearchChange={setSearch}
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
