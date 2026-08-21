import {
    useMemo,
    useState,
} from "react";

import {
    convertFileSrc,
} from "@tauri-apps/api/core";

import {
    FiExternalLink,
    FiFileText,
} from "react-icons/fi";

import {
    openFile,
} from "../../../services/localFileIntegrationService";

interface PdfPreviewProps {
    path: string;
    name: string;
}

export function PdfPreview({
    path,
    name,
}: PdfPreviewProps) {
    const [
        previewFailed,
        setPreviewFailed,
    ] = useState(false);

    const pdfUrl =
        useMemo(
            () =>
                convertFileSrc(
                    path,
                ),
            [path],
        );

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
        <iframe
            src={pdfUrl}
            title={`${name} PDF preview`}
            onError={() =>
                setPreviewFailed(true)
            }
            className="h-full w-full border-0 bg-white"
        />
    );
}
