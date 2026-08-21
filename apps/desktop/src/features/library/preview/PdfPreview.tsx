import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    readFile,
} from "@tauri-apps/plugin-fs";

import {
    FiExternalLink,
    FiFileText,
} from "react-icons/fi";

import {
    GlobalWorkerOptions,
    getDocument,
} from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
    openFile,
} from "../../../services/localFileIntegrationService";

GlobalWorkerOptions.workerSrc =
    pdfWorkerUrl;

interface PdfPreviewProps {
    path: string;
    name: string;
}

export function PdfPreview({
    path,
    name,
}: PdfPreviewProps) {
    const canvasRef =
        useRef<HTMLCanvasElement | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        previewFailed,
        setPreviewFailed,
    ] = useState(false);

    useEffect(() => {
        let cancelled =
            false;

        async function renderPdf() {
            setLoading(true);
            setPreviewFailed(false);

            try {
                const bytes =
                    await readFile(
                        path,
                    );

                const pdf =
                    await getDocument({
                        data: bytes,
                    }).promise;

                if (cancelled) {
                    await pdf.destroy();
                    return;
                }

                const page =
                    await pdf.getPage(
                        1,
                    );

                if (cancelled) {
                    await pdf.destroy();
                    return;
                }

                const viewport =
                    page.getViewport({
                        scale: 1.5,
                    });

                const canvas =
                    canvasRef.current;

                if (!canvas) {
                    await pdf.destroy();
                    return;
                }

                const context =
                    canvas.getContext(
                        "2d",
                    );

                if (!context) {
                    await pdf.destroy();
                    return;
                }

                const outputScale =
                    window.devicePixelRatio ||
                    1;

                canvas.width =
                    Math.floor(
                        viewport.width *
                            outputScale,
                    );

                canvas.height =
                    Math.floor(
                        viewport.height *
                            outputScale,
                    );

                /*
                 * Render at a higher internal resolution,
                 * but display the page fitted to the
                 * Inspector width.
                 */
                canvas.style.width =
                    "100%";

                canvas.style.height =
                    "auto";

                const transform =
                    outputScale !== 1
                        ? [
                              outputScale,
                              0,
                              0,
                              outputScale,
                              0,
                              0,
                          ]
                        : undefined;

                await page.render({
                    canvas,
                    canvasContext:
                        context,
                    viewport,
                    transform,
                }).promise;

                await pdf.destroy();

                if (!cancelled) {
                    setLoading(false);
                }
            } catch (error) {
                console.error(
                    "Failed to render PDF preview:",
                    error,
                );

                if (!cancelled) {
                    setLoading(false);
                    setPreviewFailed(true);
                }
            }
        }

        void renderPdf();

        return () => {
            cancelled =
                true;
        };
    }, [
        path,
    ]);

    async function handleOpenExternally() {
        try {
            await openFile(
                path,
            );
        } catch (error) {
            console.error(
                "Failed to open PDF externally:",
                error,
            );
        }
    }

    if (previewFailed) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <FiFileText className="text-5xl text-red-500" />

                <p className="mt-4 text-sm font-medium text-zinc-300">
                    PDF Preview Unavailable
                </p>

                <p className="mt-2 max-w-xs text-xs text-zinc-500">
                    This PDF could not be displayed inside 3D PrintVault.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        void handleOpenExternally()
                    }
                    className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                    <FiExternalLink />

                    Open Externally
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full overflow-auto bg-white">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900 text-xs text-zinc-400">
                    Loading PDF preview…
                </div>
            )}

            <div className="flex min-h-full w-full items-start justify-center p-2">
                <canvas
                    ref={
                        canvasRef
                    }
                    aria-label={`${name} PDF preview`}
                    className="h-auto w-full max-w-full bg-white shadow-sm"
                />
            </div>
        </div>
    );
}