import {
    FiGrid,
    FiList,
} from "react-icons/fi";

export type AssetTechnologyFilter =
    | "All Assets"
    | "FDM / FFF"
    | "Resin"
    | "Laser"
    | "CAD";

interface LibraryToolbarProps {
    viewMode: "grid" | "list";

    onViewModeChange: (
        mode: "grid" | "list",
    ) => void;

    technologyFilter:
    AssetTechnologyFilter;

    onTechnologyFilterChange: (
        filter: AssetTechnologyFilter,
    ) => void;
}

const filters:
    AssetTechnologyFilter[] = [
        "All Assets",
        "FDM / FFF",
        "Resin",
        "Laser",
        "CAD",
    ];

export function LibraryToolbar({
    viewMode,
    onViewModeChange,
    technologyFilter,
    onTechnologyFilterChange,
}: LibraryToolbarProps) {
    return (
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
            <div className="flex items-center gap-1">
                {filters.map(
                    (filter) => {
                        const active =
                            technologyFilter ===
                            filter;

                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() =>
                                    onTechnologyFilterChange(
                                        filter,
                                    )
                                }
                                className={
                                    active
                                        ? "rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
                                        : "rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                                }
                            >
                                {filter}
                            </button>
                        );
                    },
                )}
            </div>

            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
                <button
                    type="button"
                    onClick={() =>
                        onViewModeChange(
                            "grid",
                        )
                    }
                    className={`rounded-md p-1.5 transition ${viewMode ===
                            "grid"
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    <FiGrid />
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onViewModeChange(
                            "list",
                        )
                    }
                    className={`rounded-md p-1.5 transition ${viewMode ===
                            "list"
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    <FiList />
                </button>
            </div>
        </div>
    );
}