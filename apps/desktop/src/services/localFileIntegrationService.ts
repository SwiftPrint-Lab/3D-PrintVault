import {
    openPath,
    revealItemInDir,
} from "@tauri-apps/plugin-opener";

export async function revealFileInFinder(
    path: string,
): Promise<void> {
    const trimmedPath =
        path.trim();

    if (!trimmedPath) {
        throw new Error(
            "File path is empty.",
        );
    }

    await revealItemInDir(
        trimmedPath,
    );
}

export async function openFile(
    path: string,
): Promise<void> {
    const trimmedPath =
        path.trim();

    if (!trimmedPath) {
        throw new Error(
            "File path is empty.",
        );
    }

    await openPath(
        trimmedPath,
    );
}

export async function copyFilePath(
    path: string,
): Promise<void> {
    const trimmedPath =
        path.trim();

    if (!trimmedPath) {
        throw new Error(
            "File path is empty.",
        );
    }

    await navigator.clipboard.writeText(
        trimmedPath,
    );
}