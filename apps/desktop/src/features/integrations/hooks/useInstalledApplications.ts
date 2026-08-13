import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    detectInstalledApplications,
    type InstalledApplication,
} from "../applicationDetection";

export function useInstalledApplications() {
    const [installedApps, setInstalledApps] =
        useState<InstalledApplication[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<unknown>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const result =
                    await detectInstalledApplications();

                if (!cancelled) {
                    setInstalledApps(result);
                    setError(null);
                }
            } catch (loadError) {
                console.error(
                    "Failed to detect installed applications:",
                    loadError,
                );

                if (!cancelled) {
                    setError(loadError);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const installedById =
        useMemo(() => {
            return new Map(
                installedApps.map((app) => [
                    app.id,
                    app,
                ]),
            );
        }, [installedApps]);

    return {
        installedApps,
        installedById,
        loading,
        error,
    };
}