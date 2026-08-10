import { FiPlus, FiSearch } from "react-icons/fi";

interface TopBarProps {
    activeSection: string;
    search: string;
    onSearchChange: (value: string) => void;
}

export function TopBar({
    activeSection,
    search,
    onSearchChange,
}: TopBarProps) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
            <div>
                <h2 className="text-lg font-semibold">
                    {activeSection}
                </h2>

                <p className="text-xs text-zinc-500">
                    Manage your digital fabrication assets
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />

                    <input
                        value={search}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        placeholder="Search assets..."
                        className="h-9 w-64 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-red-600/70"
                    />
                </div>

                <button className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium transition hover:bg-red-500">
                    <FiPlus />
                    Import
                </button>
            </div>
        </header>
    );
}
