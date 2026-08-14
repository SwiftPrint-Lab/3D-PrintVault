import type {
    MachineStatus,
} from "../../../services/databaseService";

export function getMachineStatusClasses(
    status: MachineStatus,
): string {
    switch (status) {
        case "Ready":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "Busy":
            return "border-blue-500/20 bg-blue-500/10 text-blue-400";

        case "Maintenance":
            return "border-amber-500/20 bg-amber-500/10 text-amber-400";

        case "Offline":
            return "border-zinc-500/20 bg-zinc-500/10 text-zinc-400";

        default:
            return "border-white/10 bg-white/[0.03] text-zinc-400";
    }
}