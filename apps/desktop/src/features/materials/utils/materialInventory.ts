import type {
    Material,
} from "../../../services/databaseService";

export type MaterialInventoryStatus =
    | "Full"
    | "In Use"
    | "Low"
    | "Empty"
    | "Unknown";

export function getMaterialRemainingPercentage(
    material: Material,
): number | null {
    const initial =
        material.initialWeightGrams;

    const remaining =
        material.remainingWeightGrams;

    if (
        initial === undefined ||
        remaining === undefined ||
        initial <= 0
    ) {
        return null;
    }

    const percentage =
        (remaining / initial) * 100;

    return Math.max(
        0,
        Math.min(
            100,
            percentage,
        ),
    );
}

export function getMaterialInventoryStatus(
    material: Material,
): MaterialInventoryStatus {
    const percentage =
        getMaterialRemainingPercentage(
            material,
        );

    if (
        percentage === null
    ) {
        return "Unknown";
    }

    if (
        percentage <= 0
    ) {
        return "Empty";
    }

    if (
        percentage <= 20
    ) {
        return "Low";
    }

    if (
        percentage >= 95
    ) {
        return "Full";
    }

    return "In Use";
}

export function getMaterialInventoryStatusClasses(
    status: MaterialInventoryStatus,
): string {
    switch (status) {
        case "Full":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "In Use":
            return "border-blue-500/20 bg-blue-500/10 text-blue-400";

        case "Low":
            return "border-amber-500/20 bg-amber-500/10 text-amber-400";

        case "Empty":
            return "border-red-500/20 bg-red-500/10 text-red-400";

        default:
            return "border-white/10 bg-white/[0.03] text-zinc-400";
    }
}

export function getMaterialProgressBarClasses(
    status: MaterialInventoryStatus,
): string {
    switch (status) {
        case "Full":
            return "bg-emerald-500";

        case "In Use":
            return "bg-blue-500";

        case "Low":
            return "bg-amber-500";

        case "Empty":
            return "bg-red-500";

        default:
            return "bg-zinc-600";
    }
}