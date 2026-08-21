import {
    useState,
} from "react";

import {
    FiChevronDown,
    FiChevronRight,
    FiFolder,
    FiHardDrive,
} from "react-icons/fi";

import type {
    AssetFolder,
} from "../utils/assetFolders";

interface FolderBrowserProps {
    folders: AssetFolder[];

    rootName: string;

    rootPath: string;

    totalAssetCount: number;

    selectedFolderPath:
    string | null;

    onSelectFolder: (
        path: string | null,
    ) => void;
}

interface FolderTreeItemProps {
    folder: AssetFolder;

    depth: number;

    selectedFolderPath:
    string | null;

    onSelectFolder: (
        path: string,
    ) => void;
}

function FolderTreeItem({
    folder,
    depth,
    selectedFolderPath,
    onSelectFolder,
}: FolderTreeItemProps) {
    const [
        expanded,
        setExpanded,
    ] = useState(
        depth === 0,
    );

    const hasChildren =
        folder.children.length > 0;

    const selected =
        selectedFolderPath ===
        folder.path;

    return (
        <div>
            <div
                className={`group flex items-center rounded-lg transition ${selected
                    ? "bg-red-600/15 text-red-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                style={{
                    paddingLeft:
                        `${8 + depth * 16}px`,
                }}
            >
                <button
                    type="button"
                    onClick={() => {
                        if (hasChildren) {
                            setExpanded(
                                (current) =>
                                    !current,
                            );
                        }
                    }}
                    disabled={
                        !hasChildren
                    }
                    className="flex h-8 w-6 shrink-0 items-center justify-center text-zinc-600 transition hover:text-zinc-300 disabled:cursor-default"
                    aria-label={
                        expanded
                            ? "Collapse folder"
                            : "Expand folder"
                    }
                >
                    {hasChildren ? (
                        expanded ? (
                            <FiChevronDown
                                size={13}
                            />
                        ) : (
                            <FiChevronRight
                                size={13}
                            />
                        )
                    ) : (
                        <span className="w-[13px]" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onSelectFolder(
                            folder.path,
                        )
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
                >
                    <FiFolder
                        size={15}
                        className="shrink-0"
                    />

                    <span className="min-w-0 flex-1 truncate text-xs">
                        {folder.name}
                    </span>

                    <span className="shrink-0 text-[10px] text-zinc-600">
                        {folder.assetCount}
                    </span>
                </button>
            </div>

            {expanded &&
                hasChildren && (
                    <div>
                        {folder.children.map(
                            (child) => (
                                <FolderTreeItem
                                    key={
                                        child.path
                                    }
                                    folder={
                                        child
                                    }
                                    depth={
                                        depth + 1
                                    }
                                    selectedFolderPath={
                                        selectedFolderPath
                                    }
                                    onSelectFolder={
                                        onSelectFolder
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
        </div>
    );
}

export function FolderBrowser({
    folders,
    rootName,
    rootPath,
    totalAssetCount,
    selectedFolderPath,
    onSelectFolder,
}: FolderBrowserProps) {
    const [
        rootExpanded,
        setRootExpanded,
    ] = useState(true);

    const rootSelected =
        selectedFolderPath ===
        rootPath;

    return (
        <aside className="flex min-h-0 w-64 shrink-0 flex-col border-r border-white/10 bg-black/10">
            <div className="border-b border-white/10 px-4 py-4">
                <div className="flex items-center gap-2">
                    <FiHardDrive
                        size={14}
                        className="text-zinc-500"
                    />

                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-300">
                            Folders
                        </p>

                        <p className="mt-0.5 text-[10px] text-zinc-600">
                            Mirrors your watched folder
                        </p>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <button
                    type="button"
                    onClick={() =>
                        onSelectFolder(
                            null,
                        )
                    }
                    className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${selectedFolderPath ===
                        null
                        ? "bg-red-600/15 text-red-400"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                >
                    <FiHardDrive
                        size={15}
                        className="shrink-0"
                    />

                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        All Assets
                    </span>

                    <span className="text-[10px] text-zinc-600">
                        {totalAssetCount}
                    </span>
                </button>

                <div
                    className={`flex items-center rounded-lg transition ${rootSelected
                        ? "bg-red-600/15 text-red-400"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setRootExpanded(
                                (current) =>
                                    !current,
                            )
                        }
                        className="flex h-8 w-7 shrink-0 items-center justify-center text-zinc-600 transition hover:text-zinc-300"
                        aria-label={
                            rootExpanded
                                ? "Collapse watched folder"
                                : "Expand watched folder"
                        }
                    >
                        {rootExpanded ? (
                            <FiChevronDown
                                size={13}
                            />
                        ) : (
                            <FiChevronRight
                                size={13}
                            />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onSelectFolder(
                                rootPath,
                            )
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
                    >
                        <FiFolder
                            size={15}
                            className="shrink-0"
                        />

                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                            {rootName}
                        </span>

                        <span className="shrink-0 text-[10px] text-zinc-600">
                            {totalAssetCount}
                        </span>
                    </button>
                </div>

                {rootExpanded && (
                    <div className="mt-1">
                        {folders.map(
                            (folder) => (
                                <FolderTreeItem
                                    key={
                                        folder.path
                                    }
                                    folder={
                                        folder
                                    }
                                    depth={0}
                                    selectedFolderPath={
                                        selectedFolderPath
                                    }
                                    onSelectFolder={
                                        (path) =>
                                            onSelectFolder(
                                                path,
                                            )
                                    }
                                />
                            ),
                        )}

                        {folders.length ===
                            0 && (
                                <p className="px-8 py-3 text-[10px] text-zinc-600">
                                    No folders discovered.
                                </p>
                            )}
                    </div>
                )}
            </div>
        </aside>
    );
}