import {
    FiArrowDown,
    FiArrowUp,
    FiGrid,
    FiList,
} from "react-icons/fi";

export type AssetTechnologyFilter =
    | "All Assets"
    | "FDM / FFF"
    | "Resin"
    | "Laser"
    | "CAD";

export type AssetSortOption =
    | "Date Added"
    | "Name"
    | "File Size"
    | "Most Opened"
    | "Printed";

export type AssetSortDirection =
    | "Ascending"
    | "Descending";

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

    sortOption:
    AssetSortOption;

    onSortOptionChange: (
        option: AssetSortOption,
    ) => void;

    sortDirection:
    AssetSortDirection;

    onSortDirectionChange: (
        direction: AssetSortDirection,
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

const sortOptions:
    AssetSortOption[] = [
        "Date Added",
        "Name",
        "File Size",
        "Most Opened",
        "Printed",
    ];

export function LibraryToolbar({
    viewMode,
    onViewModeChange,
    technologyFilter,
    onTechnologyFilterChange,
    sortOption,
    onSortOptionChange,
    sortDirection,
    onSortDirectionChange,
}: LibraryToolbarProps) {
    function toggleSortDirection() {
        onSortDirectionChange(
            sortDirection ===
                "Ascending"
                ? "Descending"
                : "Ascending",
        );
    }

    return (
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-3">
            {/* --------------------------------------------------
             * TECHNOLOGY FILTERS
             * -------------------------------------------------- */}

            <div className="flex min-w-0 items-center gap-1">
                {filters.map(
                    (filter) => {
                        const active =
                            technologyFilter ===
                            filter;

                        return (
                            <button
                                key={
                                    filter
                                }
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
                                {
                                    filter
                                }
                            </button>
                        );
                    },
                )}
            </div>

            {/* --------------------------------------------------
             * RIGHT-SIDE CONTROLS
             * -------------------------------------------------- */}

            <div className="flex shrink-0 items-center gap-2">
                {/* ----------------------------------------------
                 * SORT BY
                 * ---------------------------------------------- */}

                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                    <span className="pl-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                        Sort
                    </span>

                    <select
                        value={
                            sortOption
                        }
                        onChange={(event) =>
                            onSortOptionChange(
                                event.target.value as AssetSortOption,
                            )
                        }
                        className="bg-transparent px-1 py-1 text-xs text-zinc-300 outline-none"
                    >
                        {sortOptions.map(
                            (option) => (
                                <option
                                    key={
                                        option
                                    }
                                    value={
                                        option
                                    }
                                    className="bg-zinc-900 text-zinc-100"
                                >
                                    {
                                        option
                                    }
                                </option>
                            ),
                        )}
                    </select>

                    <button
                        type="button"
                        onClick={
                            toggleSortDirection
                        }
                        className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                        title={
                            sortDirection
                        }
                        aria-label={`Sort ${sortDirection}`}
                    >
                        {sortDirection ===
                            "Ascending" ? (
                            <FiArrowUp />
                        ) : (
                            <FiArrowDown />
                        )}
                    </button>
                </div>

                {/* ----------------------------------------------
                 * VIEW MODE
                 * ---------------------------------------------- */}

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
                        title="Grid view"
                        aria-label="Grid view"
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
                        title="List view"
                        aria-label="List view"
                    >
                        <FiList />
                    </button>
                </div>
            </div>
        </div>
    );
}