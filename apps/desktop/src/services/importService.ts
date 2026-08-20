import { open } from "@tauri-apps/plugin-dialog";
import {
  readDir,
  stat,
  watchImmediate,
  type UnwatchFn,
} from "@tauri-apps/plugin-fs";

import {
  join,
} from "@tauri-apps/api/path";

import type {
  Asset,
  FabricationTechnology,
} from "../features/library/types/asset";

const supportedExtensions = [
  "stl",
  "3mf",
  "obj",
  "step",
  "stp",
  "iges",
  "igs",
  "fbx",
  "glb",
  "gltf",
  "ply",
  "zpr",
  "ztl",
  "f3d",
  "f3z",
  "blend",
  "svg",
  "dxf",
  "ai",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
];

function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

function getExtension(fileName: string): string {
  const parts = fileName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop()?.toLowerCase() ?? "";
}

function getNameWithoutExtension(fileName: string): string {
  const extension = getExtension(fileName);

  if (!extension) {
    return fileName;
  }

  return fileName.slice(0, -(extension.length + 1));
}

function detectTechnology(
  extension: string,
): FabricationTechnology {
  const ext = extension.toLowerCase();

  if (
    [
      "blend",
      "zpr",
      "ztl",
      "f3d",
      "f3z",
      "step",
      "stp",
      "iges",
      "igs",
      "fbx",
      "glb",
      "gltf",
      "ply",
    ].includes(ext)
  ) {
    return "CAD";
  }

  if (
    [
      "svg",
      "dxf",
      "ai",
      "pdf",
      "png",
      "jpg",
      "jpeg",
      "webp",
    ].includes(ext)
  ) {
    return "Laser";
  }

  if (["stl", "3mf", "obj"].includes(ext)) {
    return "FDM / FFF";
  }

  return "CAD";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;

  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }

  const gb = mb / 1024;

  return `${gb.toFixed(2)} GB`;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function buildAsset(
  path: string,
  id: number,
): Promise<Asset> {
  const fileName = getFileName(path);
  const extension = getExtension(fileName);

  const metadata = await stat(path);

  const modifiedDate =
    metadata.mtime instanceof Date
      ? metadata.mtime
      : null;

  return {
    id,
    name: getNameWithoutExtension(fileName),
    extension: extension.toUpperCase(),
    technology: detectTechnology(extension),

    size: formatBytes(metadata.size),
    sizeBytes: metadata.size,

    modified: formatDate(modifiedDate),
    modifiedAt: modifiedDate?.toISOString(),

    path,
  };
}

export async function selectAssetsForImport(): Promise<
  Asset[]
> {
  const selection = await open({
    multiple: true,
    directory: false,
    title: "Import into 3D PrintVault",
    filters: [
      {
        name: "3D PrintVault Supported Files",
        extensions: supportedExtensions,
      },
    ],
  });

  if (!selection) {
    return [];
  }

  const paths = Array.isArray(selection)
    ? selection
    : [selection];

  const timestamp = Date.now();

  return Promise.all(
    paths.map((path, index) =>
      buildAsset(path, timestamp + index),
    ),
  );
}

export async function selectWatchedFolder(): Promise<
  string | null
> {
  const selection =
    await open({
      directory: true,
      multiple: false,
      title:
        "Choose a folder for 3D PrintVault to watch",
    });

  if (
    !selection ||
    Array.isArray(selection)
  ) {
    return null;
  }

  return selection;
}

/*
 * ---------------------------------------------------------
 * WATCHED FOLDER SCANNING
 * ---------------------------------------------------------
 */

function isSupportedFile(
  path: string,
): boolean {
  const fileName =
    getFileName(path);

  const extension =
    getExtension(fileName);

  return supportedExtensions.includes(
    extension,
  );
}

async function collectSupportedPaths(
  directoryPath: string,
  results: string[],
): Promise<void> {
  const entries =
    await readDir(
      directoryPath,
    );

  for (
    const entry
    of entries
  ) {
    const entryPath =
      await join(
        directoryPath,
        entry.name,
      );

    /*
     * Skip symlinks so recursive scans cannot
     * accidentally follow directory loops.
     */
    if (entry.isSymlink) {
      continue;
    }

    if (entry.isDirectory) {
      await collectSupportedPaths(
        entryPath,
        results,
      );

      continue;
    }

    if (
      entry.isFile &&
      isSupportedFile(
        entryPath,
      )
    ) {
      results.push(
        entryPath,
      );
    }
  }
}

export async function scanFolderForAssets(
  folderPath: string,
): Promise<Asset[]> {
  console.log(
    "[WatchedFolder] Scanning folder:",
    JSON.stringify(folderPath),
  );

  const paths: string[] = [];

  try {
    await collectSupportedPaths(
      folderPath,
      paths,
    );
  } catch (error) {
    console.error(
      "[WatchedFolder] Directory scan failed:",
      error,
    );

    throw error;
  }

  console.log(
    "[WatchedFolder] Supported paths found:",
    paths.length,
  );

  console.log(
    "[WatchedFolder] First discovered paths:",
    paths.slice(0, 20),
  );

  const timestamp =
    Date.now();

  const assets: Asset[] = [];

  for (
    let index = 0;
    index < paths.length;
    index += 1
  ) {
    try {
      const asset =
        await buildAsset(
          paths[index],
          timestamp + index,
        );

      assets.push(
        asset,
      );
    } catch (error) {
      console.error(
        "[WatchedFolder] Failed to build asset:",
        paths[index],
        error,
      );
    }
  }

  console.log(
    "[WatchedFolder] Assets successfully built:",
    assets.length,
  );

  return assets;
}

/*
 * ---------------------------------------------------------
 * INCREMENTAL WATCHED-PATH SCANNING
 * ---------------------------------------------------------
 */

export async function scanPathsForAssets(
  changedPaths: string[],
  watchedRootPath: string,
): Promise<Asset[]> {
  const discoveredPaths =
    new Set<string>();

  for (
    const changedPath
    of changedPaths
  ) {
    if (
      changedPath ===
      watchedRootPath
    ) {
      continue;
    }
    try {
      const metadata =
        await stat(
          changedPath,
        );

      if (metadata.isDirectory) {
        const nestedPaths:
          string[] = [];

        await collectSupportedPaths(
          changedPath,
          nestedPaths,
        );

        for (
          const nestedPath
          of nestedPaths
        ) {
          discoveredPaths.add(
            nestedPath,
          );
        }

        continue;
      }

      if (
        metadata.isFile &&
        isSupportedFile(
          changedPath,
        )
      ) {
        discoveredPaths.add(
          changedPath,
        );
      }
    } catch {
      /*
       * Filesystem notifications can include temporary,
       * renamed, or deleted paths that no longer exist by
       * the time the debounce completes. Those paths do
       * not need to be imported.
       */
    }
  }

  const paths =
    Array.from(
      discoveredPaths,
    );

  console.log(
    "[WatchedFolder] Incremental supported paths:",
    paths.length,
    paths,
  );

  const timestamp =
    Date.now();

  const assets: Asset[] =
    [];

  for (
    let index = 0;
    index < paths.length;
    index += 1
  ) {
    try {
      const asset =
        await buildAsset(
          paths[index],
          timestamp + index,
        );

      assets.push(
        asset,
      );
    } catch (error) {
      console.error(
        "[WatchedFolder] Failed to build incremental asset:",
        paths[index],
        error,
      );
    }
  }

  return assets;
}

/*
 * ---------------------------------------------------------
 * WATCHED FOLDER LIVE MONITORING
 * ---------------------------------------------------------
 */

export async function watchFolderForChanges(
  folderPath: string,
  onChange: (
    changedPaths: string[],
  ) => void | Promise<void>,
): Promise<UnwatchFn> {
  let debounceTimer:
    ReturnType<typeof setTimeout> |
    null = null;

  const pendingPaths =
    new Set<string>();

  const unwatch =
    await watchImmediate(
      folderPath,
      (event) => {
        console.log(
          "[WatchedFolder] Filesystem event:",
          event.type,
          event.paths,
        );

        for (
          const changedPath
          of event.paths
        ) {
          pendingPaths.add(
            changedPath,
          );
        }

        if (
          debounceTimer !==
          null
        ) {
          clearTimeout(
            debounceTimer,
          );
        }

        /*
         * Finder, download clients, unzip tools, and other
         * applications can emit many events while creating
         * one model folder. Accumulate all affected paths
         * and process them as one incremental batch.
         */
        debounceTimer =
          setTimeout(
            () => {
              debounceTimer =
                null;

              const changedPaths =
                Array.from(
                  pendingPaths,
                );

              pendingPaths.clear();

              if (
                changedPaths.length >
                0
              ) {
                void onChange(
                  changedPaths,
                );
              }
            },
            1500,
          );
      },
      {
        recursive: true,
      },
    );

  return () => {
    if (
      debounceTimer !==
      null
    ) {
      clearTimeout(
        debounceTimer,
      );

      debounceTimer =
        null;
    }

    pendingPaths.clear();

    unwatch();
  };
}
