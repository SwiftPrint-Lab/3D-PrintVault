import { invoke } from "@tauri-apps/api/core";

import {
    externalApplications,
} from "./applications";

export interface InstalledApplication {
    id: string;
    installed: boolean;
    path?: string;
}

export async function detectInstalledApplications(): Promise<
    InstalledApplication[]
> {
    const candidates =
        externalApplications.map(
            (application) => ({
                id: application.id,

                macAppNames:
                    application.macAppNames,
            }),
        );

    return invoke<
        InstalledApplication[]
    >(
        "detect_installed_applications",
        {
            candidates,
        },
    );
}