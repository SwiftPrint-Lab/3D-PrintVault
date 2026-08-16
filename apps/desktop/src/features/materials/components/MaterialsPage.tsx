import {
    useState,
} from "react";

import type {
    Material,
    MaterialCategory,
} from "../../../services/databaseService";

import {
    getMaterialInventoryStatus,
    getMaterialInventoryStatusClasses,
    getMaterialProgressBarClasses,
    getMaterialRemainingPercentage,
} from "../utils/materialInventory";

interface MaterialsPageProps {
    materials: Material[];

    onCreateMaterial: (
        name: string,
        brand: string,
        category: MaterialCategory,
        materialType: string,
    ) => Promise<Material | null>;

    onDeleteMaterial: (
        material: Material,
    ) => Promise<void>;

    onOpenMaterial: (
        material: Material,
    ) => void;
}

export function MaterialsPage({
    materials,
    onCreateMaterial,
    onDeleteMaterial,
    onOpenMaterial,
}: MaterialsPageProps) {
    const [
        creatingMaterial,
        setCreatingMaterial,
    ] = useState(false);

    const [
        name,
        setName,
    ] = useState("");

    const [
        brand,
        setBrand,
    ] = useState("");

    const [
        category,
        setCategory,
    ] = useState<MaterialCategory>(
        "Filament",
    );

    const [
        materialType,
        setMaterialType,
    ] = useState("");

    const [
        saving,
        setSaving,
    ] = useState(false);

    function resetForm() {
        setName("");
        setBrand("");
        setCategory(
            "Filament",
        );
        setMaterialType("");
    }

    function closeCreateModal() {
        setCreatingMaterial(
            false,
        );

        resetForm();
    }

    async function handleCreate() {
        const trimmedName =
            name.trim();

        const trimmedBrand =
            brand.trim();

        const trimmedMaterialType =
            materialType.trim();

        if (
            !trimmedName ||
            !trimmedBrand ||
            !trimmedMaterialType
        ) {
            return;
        }

        try {
            setSaving(true);

            const material =
                await onCreateMaterial(
                    trimmedName,
                    trimmedBrand,
                    category,
                    trimmedMaterialType,
                );

            if (material) {
                closeCreateModal();
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* ------------------------------------------------------
       * MATERIALS HEADER
       * ------------------------------------------------------ */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Materials
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Manage filament, resin, and fabrication materials.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setCreatingMaterial(
                            true,
                        )
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                >
                    + Add Material
                </button>
            </div>

            {/* ------------------------------------------------------
       * MATERIALS CONTENT
       * ------------------------------------------------------ */}

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {materials.length ===
                    0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="max-w-md text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500">
                                ◉
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-zinc-100">
                                No materials yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Add filament, resin, or other fabrication materials to begin tracking inventory.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setCreatingMaterial(
                                        true,
                                    )
                                }
                                className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                            >
                                + Add Material
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        {materials.map(
                            (material) => {
                                const percentage =
                                    getMaterialRemainingPercentage(
                                        material,
                                    );

                                const inventoryStatus =
                                    getMaterialInventoryStatus(
                                        material,
                                    );

                                return (
                                    <div
                                        key={
                                            material.id
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            onOpenMaterial(
                                                material,
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key ===
                                                "Enter" ||
                                                event.key ===
                                                " "
                                            ) {
                                                event.preventDefault();

                                                onOpenMaterial(
                                                    material,
                                                );
                                            }
                                        }}
                                        className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-red-500/30 hover:bg-white/[0.04]"
                                    >
                                        {/* ------------------------------------------------
                   * CARD HEADER
                   * ------------------------------------------------ */}

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-semibold text-zinc-100">
                                                    {
                                                        material.name
                                                    }
                                                </h3>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {
                                                        material.brand
                                                    }
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-zinc-400">
                                                {
                                                    material.category
                                                }
                                            </span>
                                        </div>

                                        {/* ------------------------------------------------
                   * CARD DETAILS
                   * ------------------------------------------------ */}

                                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-zinc-500">
                                                    Material
                                                </span>

                                                <span className="text-zinc-300">
                                                    {
                                                        material.materialType
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-zinc-500">
                                                    Color
                                                </span>

                                                <span className="text-zinc-300">
                                                    {
                                                        material.color ??
                                                        "Not set"
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-zinc-500">
                                                    Remaining
                                                </span>

                                                <span className="text-zinc-300">
                                                    {
                                                        material.remainingWeightGrams !==
                                                            undefined
                                                            ? `${material.remainingWeightGrams} g`
                                                            : "Not set"
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-zinc-500">
                                                    Drying
                                                </span>

                                                <span className="text-zinc-300">
                                                    {
                                                        material.dryingStatus
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* ------------------------------------------------
                   * CARD ACTIONS
                   * ------------------------------------------------ */}

                                        <div className="mt-4 border-t border-white/10 pt-4">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    void onDeleteMaterial(
                                                        material,
                                                    );
                                                }}
                                                className="text-xs text-red-400 transition hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}
            </div>

            {/* ------------------------------------------------------
 * ADD MATERIAL MODAL
 * ------------------------------------------------------ */}

            {creatingMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
                    <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                        {/* --------------------------------------------------
             * MODAL HEADER
             * -------------------------------------------------- */}

                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">
                                    Add Material
                                </h3>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Add a fabrication material to PrintVault.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    closeCreateModal();
                                }}
                                className="text-xl leading-none text-zinc-500 transition hover:text-white"
                                aria-label="Close add material"
                            >
                                ×
                            </button>
                        </div>

                        {/* --------------------------------------------------
             * MODAL CONTENT
             * -------------------------------------------------- */}

                        <div className="space-y-4 p-5">
                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Material Name
                                </span>

                                <input
                                    autoFocus
                                    value={
                                        name
                                    }
                                    onChange={(event) =>
                                        setName(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Bambu Lab PLA Basic Black"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Brand
                                </span>

                                <input
                                    value={
                                        brand
                                    }
                                    onChange={(event) =>
                                        setBrand(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Bambu Lab"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Category
                                </span>

                                <select
                                    value={
                                        category
                                    }
                                    onChange={(event) =>
                                        setCategory(
                                            event.target.value as MaterialCategory,
                                        )
                                    }
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                                >
                                    <option value="Filament">
                                        Filament
                                    </option>

                                    <option value="Resin">
                                        Resin
                                    </option>

                                    <option value="Sheet">
                                        Sheet
                                    </option>

                                    <option value="Powder">
                                        Powder
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Material Type
                                </span>

                                <input
                                    value={
                                        materialType
                                    }
                                    onChange={(event) =>
                                        setMaterialType(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="PLA Basic"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>
                        </div>

                        {/* --------------------------------------------------
             * MODAL FOOTER
             * -------------------------------------------------- */}

                        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeCreateModal
                                }
                                disabled={
                                    saving
                                }
                                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleCreate()
                                }
                                disabled={
                                    saving ||
                                    !name.trim() ||
                                    !brand.trim() ||
                                    !materialType.trim()
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {saving
                                    ? "Adding..."
                                    : "Add Material"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}