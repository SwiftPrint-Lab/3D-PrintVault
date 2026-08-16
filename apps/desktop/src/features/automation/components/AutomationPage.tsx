interface AutomationItem {
    title: string;
    description: string;
    status: "Active" | "Planned";
    details: string[];
}

const automationItems: AutomationItem[] = [
    {
        title: "Machine Status Sync",
        description:
            "Automatically keeps machine availability synchronized with job status.",
        status: "Active",
        details: [
            "Printing jobs set the assigned machine to Busy.",
            "Completed, Failed, or Cancelled jobs release the machine back to Ready.",
            "Maintenance and Offline states are preserved.",
        ],
    },
    {
        title: "Material Usage Deduction",
        description:
            "Automatically deducts recorded material usage when a fabrication job is completed.",
        status: "Active",
        details: [
            "Uses the job's assigned material.",
            "Subtracts the recorded material usage in grams.",
            "Remaining inventory never drops below 0 g.",
        ],
    },
    {
        title: "Duplicate Deduction Protection",
        description:
            "Prevents completed jobs from consuming material inventory more than once.",
        status: "Active",
        details: [
            "Completed jobs are marked after inventory is deducted.",
            "Editing and saving the same completed job does not deduct material again.",
            "Protection persists in the PrintVault database.",
        ],
    },
    {
        title: "Low Material Monitoring",
        description:
            "Tracks material inventory levels and highlights materials that are running low.",
        status: "Active",
        details: [
            "Full",
            "In Use",
            "Low",
            "Empty",
        ],
    },
    {
        title: "Advanced Rule Builder",
        description:
            "Create custom production rules and automated actions.",
        status: "Planned",
        details: [
            "Custom triggers",
            "Custom actions",
            "Per-machine automation",
            "Per-material automation",
        ],
    },
];

function getStatusClasses(
    status: AutomationItem["status"],
) {
    switch (status) {
        case "Active":
            return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "Planned":
            return "border-zinc-500/20 bg-zinc-500/10 text-zinc-400";

        default:
            return "border-white/10 bg-white/[0.03] text-zinc-400";
    }
}

export function AutomationPage() {
    const activeCount =
        automationItems.filter(
            (item) =>
                item.status === "Active",
        ).length;

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Automation
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        Production and inventory workflows managed automatically by PrintVault.
                    </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-100">
                        {activeCount}
                    </span>
                    {" "}
                    active automations
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                        <p className="text-xs text-zinc-500">
                            Active Automations
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-zinc-100">
                            {activeCount}
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                        <p className="text-xs text-zinc-500">
                            Machine Automation
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-emerald-400">
                            Active
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                        <p className="text-xs text-zinc-500">
                            Inventory Automation
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-emerald-400">
                            Active
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {automationItems.map(
                        (item) => (
                            <div
                                key={
                                    item.title
                                }
                                className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-100">
                                            {
                                                item.title
                                            }
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                                            {
                                                item.description
                                            }
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                            item.status,
                                        )}`}
                                    >
                                        {
                                            item.status
                                        }
                                    </span>
                                </div>

                                <div className="mt-5 border-t border-white/10 pt-4">
                                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                        Behavior
                                    </p>

                                    <div className="space-y-2">
                                        {item.details.map(
                                            (detail) => (
                                                <div
                                                    key={
                                                        detail
                                                    }
                                                    className="flex items-start gap-2 text-xs text-zinc-400"
                                                >
                                                    <span className="mt-[2px] text-zinc-600">
                                                        •
                                                    </span>

                                                    <span>
                                                        {
                                                            detail
                                                        }
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </section>
    );
}