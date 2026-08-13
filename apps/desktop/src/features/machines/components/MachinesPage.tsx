import {
    useState,
} from "react";

import type {
    Machine,
    MachineType,
} from "../../../services/databaseService";

interface MachinesPageProps {
    machines: Machine[];

    onCreateMachine: (
        name: string,
        manufacturer: string,
        model: string,
        type: MachineType,
    ) => Promise<Machine | null>;

    onDeleteMachine: (
        machine: Machine,
    ) => Promise<void>;

    onOpenMachine: (
        machine: Machine,
    ) => void;
}

export function MachinesPage({
    machines,
    onCreateMachine,
    onDeleteMachine,
    onOpenMachine,
}: MachinesPageProps) {
    const [
        showCreateForm,
        setShowCreateForm,
    ] = useState(false);

    const [
        name,
        setName,
    ] = useState("");

    const [
        manufacturer,
        setManufacturer,
    ] = useState("");

    const [
        model,
        setModel,
    ] = useState("");

    const [
        type,
        setType,
    ] = useState<MachineType>(
        "FDM / FFF",
    );

    const [
        creating,
        setCreating,
    ] = useState(false);

    async function handleSubmit() {
        const trimmedName =
            name.trim();

        const trimmedManufacturer =
            manufacturer.trim();

        const trimmedModel =
            model.trim();

        if (
            !trimmedName ||
            !trimmedManufacturer ||
            !trimmedModel
        ) {
            return;
        }

        try {
            setCreating(true);

            const machine =
                await onCreateMachine(
                    trimmedName,
                    trimmedManufacturer,
                    trimmedModel,
                    type,
                );

            if (!machine) {
                return;
            }

            setName("");
            setManufacturer("");
            setModel("");
            setType(
                "FDM / FFF",
            );

            setShowCreateForm(
                false,
            );
        } finally {
            setCreating(false);
        }
    }

    return (
        <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Machines
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Manage printers and fabrication machines.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setShowCreateForm(
                            true,
                        )
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                >
                    + Add Machine
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {machines.length === 0 ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="max-w-md text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl text-zinc-500">
                                ⚙
                            </div>

                            <h3 className="mt-5 text-base font-semibold text-zinc-100">
                                No machines yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Add your first 3D printer or fabrication
                                machine to PrintVault.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateForm(
                                        true,
                                    )
                                }
                                className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                            >
                                + Add Machine
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {machines.map(
                            (machine) => (
                                <article
                                    key={
                                        machine.id
                                    }
                                    onClick={() =>
                                        onOpenMachine(
                                            machine,
                                        )
                                    }
                                    className="cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] transition hover:border-white/20 hover:bg-white/[0.04]"
                                >
                                    <div className="flex h-36 items-center justify-center bg-white/[0.025]">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-2xl text-zinc-500">
                                            ⚙
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-semibold text-zinc-100">
                                                    {
                                                        machine.name
                                                    }
                                                </h3>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {
                                                        machine.manufacturer
                                                    }{" "}
                                                    {
                                                        machine.model
                                                    }
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-400">
                                                {
                                                    machine.status
                                                }
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                                            <span className="text-[10px] text-zinc-500">
                                                {
                                                    machine.type
                                                }
                                            </span>

                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    void onDeleteMachine(
                                                        machine,
                                                    );
                                                }}
                                                className="text-[10px] text-red-400 transition hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                )}
            </div>

            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
                    <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">
                                    Add Machine
                                </h3>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Add a printer or fabrication machine.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateForm(
                                        false,
                                    )
                                }
                                className="text-zinc-500 transition hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Machine Name
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
                                    placeholder="Alpha Prime"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Manufacturer
                                </span>

                                <input
                                    value={
                                        manufacturer
                                    }
                                    onChange={(event) =>
                                        setManufacturer(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Bambu Lab"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Model
                                </span>

                                <input
                                    value={
                                        model
                                    }
                                    onChange={(event) =>
                                        setModel(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="X2D"
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-zinc-400">
                                    Machine Type
                                </span>

                                <select
                                    value={
                                        type
                                    }
                                    onChange={(event) =>
                                        setType(
                                            event.target.value as MachineType,
                                        )
                                    }
                                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                                >
                                    <option value="FDM / FFF">
                                        FDM / FFF
                                    </option>

                                    <option value="Resin">
                                        Resin
                                    </option>

                                    <option value="Laser">
                                        Laser
                                    </option>

                                    <option value="CNC">
                                        CNC
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateForm(
                                        false,
                                    )
                                }
                                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    creating ||
                                    !name.trim() ||
                                    !manufacturer.trim() ||
                                    !model.trim()
                                }
                                onClick={() =>
                                    void handleSubmit()
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {creating
                                    ? "Adding..."
                                    : "Add Machine"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}