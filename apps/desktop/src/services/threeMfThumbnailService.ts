import { invoke } from "@tauri-apps/api/core";

export async function getThreeMfThumbnailUrl(
    path: string,
): Promise<string | null> {
    try {
        const bytes = await invoke<number[]>(
            "extract_3mf_thumbnail",
            {
                path,
            },
        );

        if (!bytes || bytes.length === 0) {
            return null;
        }

        const blob = new Blob(
            [new Uint8Array(bytes)],
            {
                type: "image/png",
            },
        );

        return URL.createObjectURL(blob);
    } catch (error) {
        console.error(
            "Failed to extract 3MF thumbnail:",
            error,
        );

        return null;
    }
}

export function revokeThreeMfThumbnailUrl(
    url: string | null,
): void {
    if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
    }
}
