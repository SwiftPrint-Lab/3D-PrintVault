import {
  useState,
  type MouseEvent,
} from "react";

import type { Asset } from "../types/asset";

import type {
  Collection,
  Project,
} from "../../../services/databaseService";

import { AssetCard } from "./AssetCard";
import { AssetContextMenu } from "./AssetContextMenu";

interface AssetGridProps {
  assets: Asset[];
  selectedAsset: Asset;
  viewMode: "grid" | "list";

  onSelect: (
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

interface ContextMenuState {
  asset: Asset;
  x: number;
  y: number;
}

export function AssetGrid({
  assets,
  selectedAsset,
  viewMode,
  onSelect,
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
}: AssetGridProps) {
  const [
    contextMenu,
    setContextMenu,
  ] = useState<ContextMenuState | null>(
    null,
  );

  function handleContextMenu(
    event: MouseEvent,
    asset: Asset,
  ) {
    event.preventDefault();

    onSelect(
      asset,
    );

    setContextMenu({
      asset,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function closeContextMenu() {
    setContextMenu(
      null,
    );
  }

  function renderContextMenu() {
    if (!contextMenu) {
      return null;
    }

    return (
      <AssetContextMenu
        asset={
          contextMenu.asset
        }
        x={
          contextMenu.x
        }
        y={
          contextMenu.y
        }
        onClose={
          closeContextMenu
        }
        onSelect={
          onSelect
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
    );
  }

  if (
    viewMode ===
    "list"
  ) {
    return (
      <>
        <div>
          {assets.map(
            (asset) => (
              <button
                key={
                  asset.id
                }
                type="button"
                onClick={() =>
                  onSelect(
                    asset,
                  )
                }
                onContextMenu={(
                  event,
                ) =>
                  handleContextMenu(
                    event,
                    asset,
                  )
                }
                className={`grid w-full grid-cols-[1fr_120px_100px_100px] items-center border-b border-white/10 px-4 py-3 text-left text-sm last:border-b-0 ${selectedAsset.id ===
                  asset.id
                  ? "bg-red-950/20"
                  : "hover:bg-white/[0.03]"
                  }`}
              >
                <span className="truncate">
                  {
                    asset.name
                  }
                </span>

                <span className="text-xs text-zinc-500">
                  {
                    asset.technology
                  }
                </span>

                <span className="text-xs text-zinc-500">
                  {
                    asset.size
                  }
                </span>

                <span className="text-xs text-zinc-500">
                  {
                    asset.modified
                  }
                </span>
              </button>
            ),
          )}
        </div>

        {renderContextMenu()}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {assets.map(
          (asset) => (
            <AssetCard
              key={
                asset.id
              }
              asset={
                asset
              }
              selected={
                selectedAsset.id ===
                asset.id
              }
              onSelect={
                onSelect
              }
              onContextMenu={
                handleContextMenu
              }
            />
          ),
        )}
      </div>

      {renderContextMenu()}
    </>
  );
}