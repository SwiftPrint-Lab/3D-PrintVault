import type { Asset } from "../types/asset";

import type {
  Collection,
  Project,
} from "../../../services/databaseService";

import { AssetGrid } from "./AssetGrid";

import {
  LibraryToolbar,
  type AssetTechnologyFilter,
} from "./LibraryToolbar";

interface LibraryPageProps {
  assets: Asset[];

  selectedAsset: Asset;

  viewMode:
  | "grid"
  | "list";

  onViewModeChange: (
    mode: "grid" | "list",
  ) => void;

  technologyFilter:
  AssetTechnologyFilter;

  onTechnologyFilterChange: (
    filter: AssetTechnologyFilter,
  ) => void;

  onAssetSelect: (
    asset: Asset,
  ) => void;

  onDelete: (
    asset: Asset,
  ) => void;

  onUpdateFavorite: (
    asset: Asset,
    favorite: boolean,
  ) => void;

  /*
   * Collections
   */

  collections: Collection[];

  onAddToCollection: (
    asset: Asset,
    collection: Collection,
  ) => Promise<void>;

  onCreateCollection: (
    name: string,
  ) => Promise<Collection | null>;

  onRemoveFromCollection?: (
    asset: Asset,
  ) => Promise<void>;

  /*
   * Projects
   */

  projects: Project[];

  onAddToProject: (
    asset: Asset,
    project: Project,
  ) => Promise<void>;

  onCreateProject: (
    name: string,
    description: string,
  ) => Promise<Project | null>;

  onRemoveFromProject?: (
    asset: Asset,
  ) => Promise<void>;
}

export function LibraryPage({
  assets,
  selectedAsset,
  viewMode,
  onViewModeChange,
  technologyFilter,
  onTechnologyFilterChange,
  onAssetSelect,
  onDelete,
  onUpdateFavorite,

  collections,
  onAddToCollection,
  onCreateCollection,
  onRemoveFromCollection,

  projects,
  onAddToProject,
  onCreateProject,
  onRemoveFromProject,
}: LibraryPageProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <LibraryToolbar
        viewMode={
          viewMode
        }
        onViewModeChange={
          onViewModeChange
        }
        technologyFilter={
          technologyFilter
        }
        onTechnologyFilterChange={
          onTechnologyFilterChange
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <AssetGrid
          assets={
            assets
          }
          selectedAsset={
            selectedAsset
          }
          viewMode={
            viewMode
          }
          onSelect={
            onAssetSelect
          }
          onDelete={
            onDelete
          }
          onUpdateFavorite={
            onUpdateFavorite
          }

          collections={
            collections
          }
          onAddToCollection={
            onAddToCollection
          }
          onCreateCollection={
            onCreateCollection
          }
          onRemoveFromCollection={
            onRemoveFromCollection
          }

          projects={
            projects
          }
          onAddToProject={
            onAddToProject
          }
          onCreateProject={
            onCreateProject
          }
          onRemoveFromProject={
            onRemoveFromProject
          }
        />
      </div>
    </section>
  );
}