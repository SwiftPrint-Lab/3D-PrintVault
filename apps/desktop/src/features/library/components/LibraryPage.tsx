import {
  useMemo,
  useState,
} from "react";

import type {
  Asset,
} from "../types/asset";

import type {
  Collection,
  Project,
} from "../../../services/databaseService";

import { AssetGrid } from "./AssetGrid";
import { FolderBrowser } from "./FolderBrowser";

import {
  LibraryToolbar,
  type AssetTechnologyFilter,
  type AssetSortDirection,
  type AssetSortOption,
} from "./LibraryToolbar";

import {
  buildAssetFolderTree,
  getAssetsInFolder,
} from "../utils/assetFolders";

interface LibraryPageProps {
  assets: Asset[];

  allAssets: Asset[];

  selectedAsset: Asset;

  watchedFolderPath:
  string | null;

  viewMode:
  | "grid"
  | "list";

  onViewModeChange: (
    mode:
      | "grid"
      | "list",
  ) => void;

  technologyFilter:
  AssetTechnologyFilter;

  onTechnologyFilterChange: (
    filter:
      AssetTechnologyFilter,
  ) => void;

  sortOption:
  AssetSortOption;

  onSortOptionChange: (
    option:
      AssetSortOption,
  ) => void;

  sortDirection:
  AssetSortDirection;

  onSortDirectionChange: (
    direction:
      AssetSortDirection,
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

  collections:
  Collection[];

  onAddToCollection: (
    asset: Asset,
    collection: Collection,
  ) => Promise<void>;

  onCreateCollection: (
    name: string,
  ) => Promise<
    Collection | null
  >;

  onRemoveFromCollection?: (
    asset: Asset,
  ) => Promise<void>;

  /*
   * Projects
   */

  projects:
  Project[];

  onAddToProject: (
    asset: Asset,
    project: Project,
  ) => Promise<void>;

  onCreateProject: (
    name: string,
    description: string,
  ) => Promise<
    Project | null
  >;

  onRemoveFromProject?: (
    asset: Asset,
  ) => Promise<void>;
}

export function LibraryPage({
  assets,
  allAssets,
  selectedAsset,
  watchedFolderPath,

  viewMode,
  onViewModeChange,

  technologyFilter,
  onTechnologyFilterChange,

  sortOption,
  onSortOptionChange,

  sortDirection,
  onSortDirectionChange,

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
  const [
    selectedFolderPath,
    setSelectedFolderPath,
  ] =
    useState<
      string | null
    >(null);

  const folderTree =
    useMemo(
      () =>
        watchedFolderPath
          ? buildAssetFolderTree(
            allAssets,
            watchedFolderPath,
          )
          : [],
      [
        allAssets,
        watchedFolderPath,
      ],
    );

  const displayedAssets =
    useMemo(
      () => {
        if (
          !selectedFolderPath
        ) {
          return assets;
        }

        return getAssetsInFolder(
          assets,
          selectedFolderPath,
          true,
        );
      },
      [
        assets,
        selectedFolderPath,
      ],
    );

  const rootName =
    watchedFolderPath
      ?.replace(
        /\\/g,
        "/",
      )
      .replace(
        /\/$/,
        "",
      )
      .split("/")
      .pop() ??
    "Watched Folder";

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
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
        sortOption={
          sortOption
        }
        onSortOptionChange={
          onSortOptionChange
        }
        sortDirection={
          sortDirection
        }
        onSortDirectionChange={
          onSortDirectionChange
        }
      />

      <div className="flex min-h-0 flex-1">
        {watchedFolderPath && (
          <FolderBrowser
            folders={
              folderTree
            }
            rootName={
              rootName
            }
            rootPath={
              watchedFolderPath
            }
            totalAssetCount={
              allAssets.length
            }
            selectedFolderPath={
              selectedFolderPath
            }
            onSelectFolder={
              setSelectedFolderPath
            }
          />
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
          <AssetGrid
            assets={
              displayedAssets
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
      </div>
    </section>
  );
}