import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";

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