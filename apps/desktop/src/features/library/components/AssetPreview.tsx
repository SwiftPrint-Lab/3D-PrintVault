import {
    lazy,
    Suspense,
    useEffect,
    useState,
} from "react";

import { convertFileSrc } from "@tauri-apps/api/core";

import {
    FiBox,
    FiFile,
    FiFileText,
    FiImage,
    FiPenTool,
    FiTool,
} from "react-icons/fi";

import type { Asset } from "../types/asset";
import { getAssetPreviewDescriptor } from "../preview/assetPreview";
import { useModelThumbnail } from "../hooks/useModelThumbnail";

import {
    getThreeMfThumbnailUrl,
    revokeThreeMfThumbnailUrl,
} from "../../../services/threeMfThumbnailService";

const ModelViewer = lazy(async () => {
    const module = await import(
        "../preview/three/ModelViewer"
    );

    return {
        default: module.ModelViewer,
    };
});

interface AssetPreviewProps {
    asset: Asset;
    selected?: boolean;
    large?: boolean;
}

export function AssetPreview({
    asset,
    selected = false,
    large = false,
}: AssetPreviewProps) {
    return (
        <AssetPreviewContent
            key={`${asset.id}:${asset.path ?? ""}`}
            asset={asset}
            selected={selected}
            large={large}
        />
    );
}

function AssetPreviewContent({
    asset,
    selected = false,
    large = false,
}: AssetPreviewProps) {
    const preview =
        getAssetPreviewDescriptor(asset);

    const [imageFailed, setImageFailed] =
        useState(false);

    const [
        loadLargeModel,
        setLoadLargeModel,
    ] = useState(false);

    const [
        threeMfThumbnailUrl,
        setThreeMfThumbnailUrl,
    ] = useState<string | null>(null);

    const extension =
        asset.extension.toUpperCase();

    const iconClass = large
        ? "text-5xl"
        : "text-3xl";

    const containerClass = large
        ? "h-28 w-28 rounded-3xl"
        : "h-20 w-20 rounded-2xl";

    /*
     * STL / OBJ generated thumbnails
     *
     * Only enabled for Library cards.
     * These are processed through the queue
     * one model at a time.
     */

    const shouldGenerateModelThumbnail =
        !large &&
        (extension === "STL" ||
            extension === "OBJ") &&
        Boolean(asset.path);

    const {
        thumbnailUrl: modelThumbnailUrl,
        loading: modelThumbnailLoading,
        failed: modelThumbnailFailed,
    } = useModelThumbnail(
        asset,
        shouldGenerateModelThumbnail,
    );

    /*
     * ---------------------------------------------------------
     * 3MF EMBEDDED LIBRARY THUMBNAIL
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (
            large ||
            extension !== "3MF" ||
            !asset.path
        ) {
            setThreeMfThumbnailUrl(null);
            return;
        }

        let cancelled = false;
        let generatedUrl: string | null = null;

        async function loadThumbnail() {
            const url =
                await getThreeMfThumbnailUrl(
                    asset.path as string,
                );

            if (cancelled) {
                revokeThreeMfThumbnailUrl(url);
                return;
            }

            generatedUrl = url;

            setThreeMfThumbnailUrl(url);
        }

        loadThumbnail();

        return () => {
            cancelled = true;

            if (generatedUrl) {
                revokeThreeMfThumbnailUrl(
                    generatedUrl,
                );
            }
        };
    }, [
        asset.path,
        extension,
        large,
    ]);

    /*
     * ---------------------------------------------------------
     * IMAGE / SVG PREVIEWS
     * ---------------------------------------------------------
     */

    const canShowRealImage =
        (
            preview.kind === "image" ||
            extension === "SVG"
        ) &&
        Boolean(asset.path) &&
        !imageFailed;

    if (
        canShowRealImage &&
        asset.path
    ) {
        const imageUrl =
            convertFileSrc(asset.path);

        return (
            <div
                className={
                    large
                        ? "h-full w-full overflow-hidden rounded-xl"
                        : "h-full w-full overflow-hidden"
                }
            >
                <img
                    src={imageUrl}
                    alt={asset.name}
                    onError={() =>
                        setImageFailed(true)
                    }
                    className="h-full w-full object-contain p-4"
                />
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * GENERATED STL / OBJ LIBRARY THUMBNAIL
     * ---------------------------------------------------------
     */

    if (
        !large &&
        modelThumbnailUrl
    ) {
        return (
            <div className="h-full w-full overflow-hidden">
                <img
                    src={modelThumbnailUrl}
                    alt={`${asset.name} model preview`}
                    className="h-full w-full object-contain p-3"
                />
            </div>
        );
    }

    /*
     * Show a lightweight loading state while the
     * thumbnail queue is working.
     */

    if (
        !large &&
        shouldGenerateModelThumbnail &&
        modelThumbnailLoading
    ) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center text-zinc-500">
                <FiBox className="text-3xl" />

                <span className="mt-2 text-[9px] font-semibold tracking-wide">
                    Generating preview…
                </span>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * EMBEDDED 3MF LIBRARY THUMBNAIL
     * ---------------------------------------------------------
     */

    if (
        extension === "3MF" &&
        !large &&
        threeMfThumbnailUrl
    ) {
        return (
            <div className="h-full w-full overflow-hidden">
                <img
                    src={threeMfThumbnailUrl}
                    alt={`${asset.name} 3MF preview`}
                    className="h-full w-full object-contain p-3"
                />
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * 3D MODEL PREVIEWS
     * ---------------------------------------------------------
     */

    const modelExtensions =
        new Set([
            "STL",
            "OBJ",
            "3MF",
        ]);

    const is3DModel =
        modelExtensions.has(extension) &&
        Boolean(asset.path);

    /*
     * ---------------------------------------------------------
     * LARGE 3MF PROTECTION
     * ---------------------------------------------------------
     */

    const largeModelThreshold =
        100 * 1024 * 1024;

    const isLarge3Mf =
        extension === "3MF" &&
        (asset.sizeBytes ?? 0) >=
        largeModelThreshold;

    /*
     * ---------------------------------------------------------
     * LARGE 3MF INSPECTOR PLACEHOLDER
     * ---------------------------------------------------------
     */

    if (
        is3DModel &&
        asset.path &&
        large &&
        isLarge3Mf &&
        !loadLargeModel
    ) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-900 px-6 text-center">
                <FiBox className="mb-4 text-5xl text-zinc-500" />

                <p className="text-sm font-semibold text-zinc-200">
                    Large 3MF Model
                </p>

                <p className="mt-2 max-w-[230px] text-xs leading-5 text-zinc-500">
                    This model is {asset.size}.
                    Loading the interactive preview
                    may take additional time and
                    memory.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        setLoadLargeModel(true)
                    }
                    className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                >
                    Load 3D Preview
                </button>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * LIVE INTERACTIVE INSPECTOR VIEWER
     * ---------------------------------------------------------
     */

    if (
        is3DModel &&
        asset.path &&
        large
    ) {
        const modelUrl =
            convertFileSrc(asset.path);

        return (
            <div className="h-full w-full overflow-hidden rounded-xl">
                <Suspense
                    fallback={
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                            Loading 3D preview…
                        </div>
                    }
                >
                    <ModelViewer
                        url={modelUrl}
                        extension={
                            asset.extension
                        }
                        interactive
                    />
                </Suspense>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * FALLBACK ICONS
     * ---------------------------------------------------------
     */

    const icon =
        preview.kind === "image" ? (
            <FiImage />
        ) : preview.kind ===
            "vector" ? (
            <FiPenTool />
        ) : preview.kind ===
            "model" ? (
            <FiBox />
        ) : preview.kind ===
            "cad" ? (
            <FiTool />
        ) : preview.kind ===
            "document" ? (
            <FiFileText />
        ) : (
            <FiFile />
        );

    return (
        <div
            className={`flex ${containerClass} flex-col items-center justify-center border border-white/10 bg-zinc-800 transition ${selected
                    ? "text-red-500"
                    : "text-zinc-500"
                }`}
        >
            <div className={iconClass}>
                {icon}
            </div>

            {!large && (
                <span className="mt-1 text-[9px] font-semibold tracking-wide text-zinc-600">
                    {modelThumbnailFailed
                        ? `${preview.extension} preview failed`
                        : preview.extension}
                </span>
            )}
        </div>
    );
}