import { FiBox, FiPlus } from "react-icons/fi";

interface EmptyLibraryStateProps {
    onImport: () => void;
}

export function EmptyLibraryState({
    onImport,
}: EmptyLibraryStateProps) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-3xl text-zinc-500">
                    <FiBox />
                </div>

                <h2 className="mt-6 text-xl font-semibold">
                    Your library is empty
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Import your first 3D model, CAD file,
                    resin project, laser design, or reference
                    asset to start building your 3D PrintVault
                    library.
                </p>

                <button
                    onClick={onImport}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500"
                >
                    <FiPlus />
                    Import Files
                </button>
            </div>
        </div>
    );
}