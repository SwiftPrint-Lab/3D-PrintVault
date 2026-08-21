import type { Asset } from "../types/asset";

export interface AssetFolder {
    name: string;
    path: string;
    assetCount: number;
    directAssetCount: number;
    children: AssetFolder[];
}

interface MutableAssetFolder {
    name: string;
    path: string;
    directAssetCount: number;
    children: Map<string, MutableAssetFolder>;
}

/**
 * Normalize macOS/Windows path separators so the folder
 * hierarchy can be generated consistently.
 */
function normalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

/**
 * Returns the directory portion of an asset path.
 */
function getDirectoryPath(assetPath: string): string {
    const normalized = normalizePath(assetPath);
    const lastSlash = normalized.lastIndexOf("/");

    if (lastSlash <= 0) {
        return "";
    }

    return normalized.slice(0, lastSlash);
}

/**
 * Build a hierarchical folder tree from the real filesystem
 * paths already stored on PrintVault assets.
 *
 * rootPath should normally be the watched folder, such as:
 *
 * /Users/corey/Desktop/3D-Printing
 */
export function buildAssetFolderTree(
    assets: Asset[],
    rootPath: string,
): AssetFolder[] {
    const normalizedRoot = normalizePath(rootPath).replace(
        /\/$/,
        "",
    );

    const root: MutableAssetFolder = {
        name: "",
        path: normalizedRoot,
        directAssetCount: 0,
        children: new Map(),
    };

    for (const asset of assets) {
        if (!asset.path) {
            continue;
        }

        const directoryPath = getDirectoryPath(asset.path);

        if (
            directoryPath !== normalizedRoot &&
            !directoryPath.startsWith(`${normalizedRoot}/`)
        ) {
            continue;
        }

        const relativePath =
            directoryPath === normalizedRoot
                ? ""
                : directoryPath.slice(normalizedRoot.length + 1);

        if (!relativePath) {
            root.directAssetCount += 1;
            continue;
        }

        const parts = relativePath
            .split("/")
            .filter(Boolean);

        let current = root;
        let currentPath = normalizedRoot;

        for (const part of parts) {
            currentPath = `${currentPath}/${part}`;

            let child = current.children.get(part);

            if (!child) {
                child = {
                    name: part,
                    path: currentPath,
                    directAssetCount: 0,
                    children: new Map(),
                };

                current.children.set(part, child);
            }

            current = child;
        }

        current.directAssetCount += 1;
    }

    function finalize(
        folder: MutableAssetFolder,
    ): AssetFolder {
        const children = Array.from(
            folder.children.values(),
        )
            .map(finalize)
            .sort((a, b) =>
                a.name.localeCompare(
                    b.name,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base",
                    },
                ),
            );

        const childAssetCount = children.reduce(
            (total, child) =>
                total + child.assetCount,
            0,
        );

        return {
            name: folder.name,
            path: folder.path,
            directAssetCount:
                folder.directAssetCount,
            assetCount:
                folder.directAssetCount +
                childAssetCount,
            children,
        };
    }

    return Array.from(root.children.values())
        .map(finalize)
        .sort((a, b) =>
            a.name.localeCompare(
                b.name,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base",
                },
            ),
        );
}

/**
 * Return assets contained inside a selected folder.
 *
 * includeDescendants=true means selecting a folder also
 * displays assets contained in all of its subfolders.
 */
export function getAssetsInFolder(
    assets: Asset[],
    folderPath: string,
    includeDescendants = true,
): Asset[] {
    const normalizedFolder = normalizePath(
        folderPath,
    ).replace(/\/$/, "");

    return assets.filter((asset) => {
        if (!asset.path) {
            return false;
        }

        const directoryPath = getDirectoryPath(
            asset.path,
        );

        if (includeDescendants) {
            return (
                directoryPath === normalizedFolder ||
                directoryPath.startsWith(
                    `${normalizedFolder}/`,
                )
            );
        }

        return directoryPath === normalizedFolder;
    });
}