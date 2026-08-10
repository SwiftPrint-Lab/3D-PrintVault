import { FiExternalLink } from "react-icons/fi";

const applications = [
    "Bambu Studio",
    "Blender",
    "ZBrush",
    "Autodesk Fusion",
];

export function OpenInMenu() {
    return (
        <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Open In
            </p>

            <div className="space-y-2">
                {applications.map((application) => (
                    <button
                        key={application}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-sm text-zinc-300 transition hover:border-red-600/30 hover:bg-red-950/10 hover:text-white"
                    >
                        <span>{application}</span>
                        <FiExternalLink className="text-zinc-600" />
                    </button>
                ))}
            </div>

            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white">
                <FiExternalLink />
                More Applications
            </button>
        </>
    );
}
