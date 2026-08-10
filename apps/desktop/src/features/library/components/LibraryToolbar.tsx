import { FiGrid, FiList } from "react-icons/fi";

interface LibraryToolbarProps {
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
}

export function LibraryToolbar({
    viewMode,
    onViewModeChange,
}: LibraryToolbarProps) {
    return (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6">
            <div className="flex items-center gap-2">
                {["All Assets", "FDM / FFF", "Resin", "Laser", "CAD"].map(
                    (filter, index) => (
                        <button
                            key={filter}
                            className={
                                index === 0
                                    ? "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                                    : "rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                            }
                        >
                            {filter}
                        </button>
                    ),
                )}
            </div>

            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
                <button
                    onClick={() => onViewModeChange("grid")}
                    className={`rounded-md p-1.5 ${viewMode === "grid"
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-500"
                        }`}
                >
                    <FiGrid />
                </button>

                <button
                    onClick={() => onViewModeChange("list")}
                    className={`rounded-md p-1.5 ${viewMode === "list"
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-500"
                        }`}
                >
                    <FiList />
                </button>
            </div>
        </div>
    );
}
