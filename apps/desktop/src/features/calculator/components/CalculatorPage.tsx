import {
    useMemo,
    useState,
} from "react";

type PricingMode =
    | "markup"
    | "margin";

function parseNumber(
    value: string,
): number {
    const parsed =
        Number(value);

    if (
        !Number.isFinite(
            parsed,
        )
    ) {
        return 0;
    }

    return parsed;
}

function formatCurrency(
    value: number,
): string {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
        },
    ).format(
        value,
    );
}

export function CalculatorPage() {
    const [
        materialUsedGrams,
        setMaterialUsedGrams,
    ] = useState("");

    const [
        spoolWeightGrams,
        setSpoolWeightGrams,
    ] = useState("1000");

    const [
        spoolCost,
        setSpoolCost,
    ] = useState("");

    const [
        printHours,
        setPrintHours,
    ] = useState("");

    const [
        printerWatts,
        setPrinterWatts,
    ] = useState("");

    const [
        electricityRate,
        setElectricityRate,
    ] = useState("");

    const [
        laborHours,
        setLaborHours,
    ] = useState("");

    const [
        laborRate,
        setLaborRate,
    ] = useState("");

    const [
        otherCosts,
        setOtherCosts,
    ] = useState("");

    const [
        quantity,
        setQuantity,
    ] = useState("1");

    const [
        pricingMode,
        setPricingMode,
    ] = useState<PricingMode>(
        "markup",
    );

    const [
        pricingPercent,
        setPricingPercent,
    ] = useState("50");

    const calculations =
        useMemo(() => {
            const materialUsed =
                parseNumber(
                    materialUsedGrams,
                );

            const spoolWeight =
                parseNumber(
                    spoolWeightGrams,
                );

            const spoolPrice =
                parseNumber(
                    spoolCost,
                );

            const hours =
                parseNumber(
                    printHours,
                );

            const watts =
                parseNumber(
                    printerWatts,
                );

            const energyRate =
                parseNumber(
                    electricityRate,
                );

            const laborTime =
                parseNumber(
                    laborHours,
                );

            const hourlyRate =
                parseNumber(
                    laborRate,
                );

            const extras =
                parseNumber(
                    otherCosts,
                );

            const itemQuantity =
                Math.max(
                    1,
                    Math.floor(
                        parseNumber(
                            quantity,
                        ) || 1,
                    ),
                );

            const percent =
                Math.max(
                    0,
                    parseNumber(
                        pricingPercent,
                    ),
                );

            const materialCost =
                spoolWeight > 0
                    ? (
                        materialUsed /
                        spoolWeight
                    ) *
                    spoolPrice
                    : 0;

            const electricityCost =
                (
                    watts /
                    1000
                ) *
                hours *
                energyRate;

            const laborCost =
                laborTime *
                hourlyRate;

            const baseCost =
                materialCost +
                electricityCost +
                laborCost +
                extras;

            let salePrice =
                baseCost;

            if (
                pricingMode ===
                "markup"
            ) {
                salePrice =
                    baseCost *
                    (
                        1 +
                        percent /
                        100
                    );
            } else {
                const margin =
                    percent /
                    100;

                salePrice =
                    margin >= 1
                        ? baseCost
                        : baseCost /
                        (
                            1 -
                            margin
                        );
            }

            const profit =
                salePrice -
                baseCost;

            const profitMargin =
                salePrice > 0
                    ? (
                        profit /
                        salePrice
                    ) *
                    100
                    : 0;

            return {
                materialCost,
                electricityCost,
                laborCost,
                baseCost,
                salePrice,
                profit,
                profitMargin,
                quantity:
                    itemQuantity,
                totalCost:
                    baseCost *
                    itemQuantity,
                totalRevenue:
                    salePrice *
                    itemQuantity,
                totalProfit:
                    profit *
                    itemQuantity,
            };
        }, [
            materialUsedGrams,
            spoolWeightGrams,
            spoolCost,
            printHours,
            printerWatts,
            electricityRate,
            laborHours,
            laborRate,
            otherCosts,
            quantity,
            pricingMode,
            pricingPercent,
        ]);

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-white/10 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-100">
                    3D Calculator
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                    Estimate print cost, pricing, and profit.
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <CalculatorSection
                            title="Material"
                        >
                            <CalculatorInput
                                label="Material Used"
                                value={
                                    materialUsedGrams
                                }
                                onChange={
                                    setMaterialUsedGrams
                                }
                                suffix="g"
                            />

                            <CalculatorInput
                                label="Spool Weight"
                                value={
                                    spoolWeightGrams
                                }
                                onChange={
                                    setSpoolWeightGrams
                                }
                                suffix="g"
                            />

                            <CalculatorInput
                                label="Spool Cost"
                                value={
                                    spoolCost
                                }
                                onChange={
                                    setSpoolCost
                                }
                                prefix="$"
                            />
                        </CalculatorSection>

                        <CalculatorSection
                            title="Machine & Electricity"
                        >
                            <CalculatorInput
                                label="Print Time"
                                value={
                                    printHours
                                }
                                onChange={
                                    setPrintHours
                                }
                                suffix="hours"
                            />

                            <CalculatorInput
                                label="Printer Power"
                                value={
                                    printerWatts
                                }
                                onChange={
                                    setPrinterWatts
                                }
                                suffix="W"
                            />

                            <CalculatorInput
                                label="Electricity Rate"
                                value={
                                    electricityRate
                                }
                                onChange={
                                    setElectricityRate
                                }
                                prefix="$"
                                suffix="/kWh"
                            />
                        </CalculatorSection>

                        <CalculatorSection
                            title="Labor & Other Costs"
                        >
                            <CalculatorInput
                                label="Labor Time"
                                value={
                                    laborHours
                                }
                                onChange={
                                    setLaborHours
                                }
                                suffix="hours"
                            />

                            <CalculatorInput
                                label="Labor Rate"
                                value={
                                    laborRate
                                }
                                onChange={
                                    setLaborRate
                                }
                                prefix="$"
                                suffix="/hr"
                            />

                            <CalculatorInput
                                label="Other Costs"
                                value={
                                    otherCosts
                                }
                                onChange={
                                    setOtherCosts
                                }
                                prefix="$"
                            />

                            <CalculatorInput
                                label="Quantity"
                                value={
                                    quantity
                                }
                                onChange={
                                    setQuantity
                                }
                            />
                        </CalculatorSection>

                        <CalculatorSection
                            title="Pricing"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPricingMode(
                                            "markup",
                                        )
                                    }
                                    className={`rounded-xl border p-4 text-left transition ${pricingMode ===
                                            "markup"
                                            ? "border-red-500/50 bg-red-500/10"
                                            : "border-white/10 bg-white/[0.025] hover:border-white/20"
                                        }`}
                                >
                                    <p className="text-sm font-medium text-zinc-100">
                                        Markup
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        Add a percentage on top of production cost.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPricingMode(
                                            "margin",
                                        )
                                    }
                                    className={`rounded-xl border p-4 text-left transition ${pricingMode ===
                                            "margin"
                                            ? "border-red-500/50 bg-red-500/10"
                                            : "border-white/10 bg-white/[0.025] hover:border-white/20"
                                        }`}
                                >
                                    <p className="text-sm font-medium text-zinc-100">
                                        Profit Margin
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        Calculate price from your target margin.
                                    </p>
                                </button>
                            </div>

                            <CalculatorInput
                                label={
                                    pricingMode ===
                                        "markup"
                                        ? "Markup"
                                        : "Target Margin"
                                }
                                value={
                                    pricingPercent
                                }
                                onChange={
                                    setPricingPercent
                                }
                                suffix="%"
                            />
                        </CalculatorSection>
                    </div>

                    <aside className="h-fit rounded-xl border border-white/10 bg-white/[0.025] p-5 xl:sticky xl:top-0">
                        <h3 className="text-sm font-semibold text-zinc-100">
                            Estimate
                        </h3>

                        <div className="mt-5 space-y-3">
                            <ResultRow
                                label="Material"
                                value={formatCurrency(
                                    calculations.materialCost,
                                )}
                            />

                            <ResultRow
                                label="Electricity"
                                value={formatCurrency(
                                    calculations.electricityCost,
                                )}
                            />

                            <ResultRow
                                label="Labor"
                                value={formatCurrency(
                                    calculations.laborCost,
                                )}
                            />

                            <div className="my-4 border-t border-white/10" />

                            <ResultRow
                                label="Cost / Item"
                                value={formatCurrency(
                                    calculations.baseCost,
                                )}
                                strong
                            />

                            <ResultRow
                                label="Sale Price / Item"
                                value={formatCurrency(
                                    calculations.salePrice,
                                )}
                                strong
                            />

                            <ResultRow
                                label="Profit / Item"
                                value={formatCurrency(
                                    calculations.profit,
                                )}
                            />

                            <ResultRow
                                label="Profit Margin"
                                value={`${calculations.profitMargin.toFixed(
                                    1,
                                )}%`}
                            />

                            <div className="my-4 border-t border-white/10" />

                            <ResultRow
                                label={`Total Cost × ${calculations.quantity}`}
                                value={formatCurrency(
                                    calculations.totalCost,
                                )}
                            />

                            <ResultRow
                                label="Total Revenue"
                                value={formatCurrency(
                                    calculations.totalRevenue,
                                )}
                            />

                            <ResultRow
                                label="Total Profit"
                                value={formatCurrency(
                                    calculations.totalProfit,
                                )}
                                strong
                            />
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}

interface CalculatorSectionProps {
    title: string;
    children: React.ReactNode;
}

function CalculatorSection({
    title,
    children,
}: CalculatorSectionProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {
                    title
                }
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
                {
                    children
                }
            </div>
        </div>
    );
}

interface CalculatorInputProps {
    label: string;
    value: string;
    onChange: (
        value: string,
    ) => void;
    prefix?: string;
    suffix?: string;
}

function CalculatorInput({
    label,
    value,
    onChange,
    prefix,
    suffix,
}: CalculatorInputProps) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs text-zinc-500">
                {
                    label
                }
            </span>

            <div className="flex items-center rounded-lg border border-white/10 bg-zinc-950 focus-within:border-red-600/60">
                {prefix && (
                    <span className="pl-3 text-xs text-zinc-500">
                        {
                            prefix
                        }
                    </span>
                )}

                <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                        value
                    }
                    onChange={(
                        event,
                    ) =>
                        onChange(
                            event.target.value,
                        )
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-100 outline-none"
                />

                {suffix && (
                    <span className="pr-3 text-xs text-zinc-500">
                        {
                            suffix
                        }
                    </span>
                )}
            </div>
        </label>
    );
}

interface ResultRowProps {
    label: string;
    value: string;
    strong?: boolean;
}

function ResultRow({
    label,
    value,
    strong = false,
}: ResultRowProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">
                {
                    label
                }
            </span>

            <span
                className={
                    strong
                        ? "text-sm font-semibold text-zinc-100"
                        : "text-sm text-zinc-300"
                }
            >
                {
                    value
                }
            </span>
        </div>
    );
}