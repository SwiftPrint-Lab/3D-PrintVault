import type { Asset } from "../types/asset";

export type PreviewKind =
    | "image"
    | "vector"
    | "model"
    | "cad"
    | "document"
    | "fallback";

export interface AssetPreviewDescriptor {
    kind: PreviewKind;
    label: string;
    extension: string;
}

const imageExtensions = new Set([
    "PNG",
    "JPG",
    "JPEG",
    "WEBP",
]);

const vectorExtensions = new Set([
    "SVG",
    "DXF",
    "AI",
]);

const modelExtensions = new Set([
    "STL",
    "OBJ",
    "3MF",
    "GLB",
    "GLTF",
    "PLY",
    "FBX",
]);

const cadExtensions = new Set([
    "STEP",
    "STP",
    "IGES",
    "IGS",
    "F3D",
    "F3Z",
    "ZPR",
    "ZTL",
    "BLEND",
]);

const documentExtensions = new Set([
    "PDF",
]);

export function getAssetPreviewDescriptor(
    asset: Asset,
): AssetPreviewDescriptor {
    const extension = asset.extension.toUpperCase();

    if (imageExtensions.has(extension)) {
        return {
            kind: "image",
            label: "Image",
            extension,
        };
    }

    if (vectorExtensions.has(extension)) {
        return {
            kind: "vector",
            label: "Vector",
            extension,
        };
    }

    if (modelExtensions.has(extension)) {
        return {
            kind: "model",
            label: "3D Model",
            extension,
        };
    }

    if (cadExtensions.has(extension)) {
        return {
            kind: "cad",
            label: "CAD / Sculpt",
            extension,
        };
    }

    if (documentExtensions.has(extension)) {
        return {
            kind: "document",
            label: "Document",
            extension,
        };
    }

    return {
        kind: "fallback",
        label: "File",
        extension,
    };
}