import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export async function openAssetInApplication(
    assetPath: string,
    applicationPath: string,
): Promise<void> {
    await invoke(
        "open_in_application",
        {
            path: assetPath,
            applicationPath,
        },
    );
}

export async function chooseApplicationForAsset(
    assetPath: string,
): Promise<void> {
    const selection = await open({
        multiple: false,
        directory: false,
        title: "Choose Application",
        defaultPath: "/Applications",
        filters: [
            {
                name: "macOS Applications",
                extensions: ["app"],
            },
        ],
    });

    if (!selection) {
        return;
    }

    const applicationPath =
        Array.isArray(selection)
            ? selection[0]
            : selection;

    if (!applicationPath) {
        return;
    }

    await openAssetInApplication(
        assetPath,
        applicationPath,
    );
}