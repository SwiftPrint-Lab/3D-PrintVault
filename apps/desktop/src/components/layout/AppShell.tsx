import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
    activeSection: string;
    search: string;
    onSectionChange: (section: string) => void;
    onSearchChange: (value: string) => void;
    onImport: () => void;
    children: ReactNode;
}

export function AppShell({
    activeSection,
    search,
    onSectionChange,
    onSearchChange,
    onImport,
    children,
}: AppShellProps) {
    return (
        <div className="app-shell flex bg-zinc-950 text-zinc-100">
            <Sidebar
                activeSection={activeSection}
                onSectionChange={onSectionChange}
            />

            <main className="flex min-w-0 flex-1 flex-col">
                <TopBar
                    activeSection={activeSection}
                    search={search}
                    onSearchChange={onSearchChange}
                    onImport={onImport}
                />

                {children}
            </main>
        </div>
    );
}
