import {
    useEffect,
    useState,
} from "react";

import {
    convertFileSrc,
} from "@tauri-apps/api/core";

import type { Asset } from "../types/asset";

import {
    generateModelThumbnail,
    saveModelThumbnailToCache,
} from "../../../services/modelThumbnailService";

import {
    enqueueThumbnailTask,
} from "../../../services/modelThumbnailQueue";

import {
    updateAssetThumbnailPath,
} from "../../../services/databaseService";

export function useModelThumbnail(
    asset: Asset,
    enabled: boolean,
) {
    const [thumbnailUrl, setThumbnailUrl] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [failed, setFailed] =
        useState(false);

    useEffect(() => {
        const extension =
            asset.extension.toUpperCase();

        const supported =
            extension === "STL" ||
            extension === "OBJ";

        /*
         * -------------------------------------------------------
         * DISABLED / UNSUPPORTED
         * -------------------------------------------------------
         */

        if (
            !enabled ||
            !supported ||
            !asset.path
        ) {
            setThumbnailUrl(null);
            setLoading(false);
            setFailed(false);

            return;
        }

        /*
         * -------------------------------------------------------
         * EXISTING PERSISTENT CACHE
         * -------------------------------------------------------
         *
         * If SQLite already contains a thumbnail path,
         * don't render the model again.
         */

        if (asset.thumbnailPath) {
            const cachedUrl =
                convertFileSrc(
                    asset.thumbnailPath,
                );

            setThumbnailUrl(cachedUrl);
            setLoading(false);
            setFailed(false);

            return;
        }

        /*
         * -------------------------------------------------------
         * GENERATE NEW THUMBNAIL
         * -------------------------------------------------------
         */

        let cancelled = false;

        setThumbnailUrl(null);
        setLoading(true);
        setFailed(false);

        async function generate() {
            try {
                const modelUrl =
                    convertFileSrc(
                        asset.path!,
                    );

                /*
                 * Queue ensures only one expensive
                 * STL/OBJ render happens at a time.
                 */

                const thumbnailPath =
                    await enqueueThumbnailTask(
                        async () => {
                            /*
                             * 1. Render model to PNG Blob.
                             */

                            const blob =
                                await generateModelThumbnail(
                                    modelUrl,
                                    extension,
                                );

                            /*
                             * 2. Save the PNG into PrintVault's
                             *    persistent cache directory.
                             */

                            const savedPath =
                                await saveModelThumbnailToCache(
                                    asset.id,
                                    blob,
                                );

                            /*
                             * 3. Persist the path in SQLite.
                             */

                            await updateAssetThumbnailPath(
                                asset.id,
                                savedPath,
                            );

                            return savedPath;
                        },
                    );

                if (cancelled) {
                    return;
                }

                /*
                 * 4. Convert the filesystem path into
                 *    something the Tauri WebView can load.
                 */

                const cachedUrl =
                    convertFileSrc(
                        thumbnailPath,
                    );

                setThumbnailUrl(cachedUrl);
                setFailed(false);
            } catch (error) {
                console.error(
                    "Failed to generate model thumbnail:",
                    asset.path,
                    error,
                );

                if (!cancelled) {
                    setThumbnailUrl(null);
                    setFailed(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        generate();

        return () => {
            cancelled = true;
        };
    }, [
        asset.id,
        asset.path,
        asset.extension,
        asset.thumbnailPath,
        enabled,
    ]);

    return {
        thumbnailUrl,
        loading,
        failed,
    };
}