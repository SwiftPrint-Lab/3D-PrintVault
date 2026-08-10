import type { ReactNode } from "react";
import {
    FiArchive,
    FiClock,
    FiCpu,
    FiFolder,
    FiHeart,
    FiLayers,
    FiPackage,
    FiSettings,
    FiSliders,
    FiTool,
    FiZap,
} from "react-icons/fi";

interface SidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

interface NavigationItem {
    label: string;
    icon: ReactNode;
}

const navigationGroups: {
    title?: string;
    items: NavigationItem[];
}[] = [
        {
            items: [
                { label: "Library", icon: <FiArchive /> },
                { label: "Recent", icon: <FiClock /> },
                { label: "Favorites", icon: <FiHeart /> },
            ],
        },
        {
            title: "ORGANIZE",
            items: [
                { label: "Projects", icon: <FiFolder /> },
                { label: "Collections", icon: <FiLayers /> },
            ],
        },
        {
            title: "FABRICATION",
            items: [
                { label: "Machines", icon: <FiCpu /> },
                { label: "Materials", icon: <FiPackage /> },
                { label: "Jobs", icon: <FiZap /> },
            ],
        },
        {
            title: "WORKFLOW",
            items: [
                { label: "Automation", icon: <FiSliders /> },
                { label: "Integrations", icon: <FiTool /> },
            ],
        },
    ];

export function Sidebar({
    activeSection,
    onSectionChange,
}: SidebarProps) {
    return (
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-zinc-950">
            <div className="border-b border-white/10 px-5 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-lg font-black shadow-lg shadow-red-950/40">
                        3D
                    </div>

                    <div>
                        <h1 className="text-sm font-bold tracking-wide">
                            3D PrintVault
                        </h1>
                        <p className="text-xs text-zinc-500">
                            Digital Fabrication
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {navigationGroups.map((group, groupIndex) => (
                    <div
                        key={groupIndex}
                        className={groupIndex > 0 ? "mt-6" : ""}
                    >
                        {group.title && (
                            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-600">
                                {group.title}
                            </p>
                        )}

                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const active = activeSection === item.label;

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => onSectionChange(item.label)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${active
                                            ? "bg-red-600 text-white shadow-sm"
                                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-white/10 p-3">
                <button
                    onClick={() => onSectionChange("Settings")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${activeSection === "Settings"
                        ? "bg-red-600 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    <FiSettings />
                    Settings
                </button>
            </div>
        </aside>
    );
}
