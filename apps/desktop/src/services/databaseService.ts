import Database from "@tauri-apps/plugin-sql";

import type {
    Asset,
} from "../features/library/types/asset";

/*
 * ---------------------------------------------------------
 * COLLECTION TYPES
 * ---------------------------------------------------------
 */

export interface Collection {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    assetCount?: number;
}

export interface Category {
    id: number;
    name: string;

    parentId?: number;

    createdAt: string;
    updatedAt: string;

    assetCount: number;
    childCount: number;
}

/*
 * ---------------------------------------------------------
 * PROJECT TYPES
 * ---------------------------------------------------------
 */

export type ProjectStatus =
    | "Planning"
    | "In Progress"
    | "Paused"
    | "Completed"
    | "Archived";

export interface Project {
    id: number;
    name: string;
    description?: string;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
    assetCount?: number;
}

export type MachineType =
    | "FDM / FFF"
    | "Resin"
    | "Laser"
    | "CNC"
    | "Other";

export type MachineStatus =
    | "Ready"
    | "Busy"
    | "Offline"
    | "Maintenance";

export type MaterialSystem =
    | "None"
    | "AMS"
    | "AMS HT"
    | "Other";

export type ConnectionType =
    | "Local Network"
    | "Cloud"
    | "USB"
    | "Manual";

export interface Machine {
    id: number;
    name: string;
    manufacturer: string;
    model: string;
    type: MachineType;
    status: MachineStatus;

    serialNumber?: string;
    ipAddress?: string;
    hostname?: string;

    buildVolumeX?: number;
    buildVolumeY?: number;
    buildVolumeZ?: number;

    nozzleSize?: number;
    buildPlate?: string;
    materialSystem?: MaterialSystem;
    connectionType?: ConnectionType;

    notes?: string;

    createdAt: string;
    updatedAt: string;
}

export type MaterialCategory =
    | "Filament"
    | "Resin"
    | "Sheet"
    | "Powder"
    | "Other";

export type MaterialDryingStatus =
    | "Dry"
    | "Needs Drying"
    | "Drying"
    | "Unknown";

export interface Material {
    id: number;

    name: string;
    brand: string;
    category: MaterialCategory;
    materialType: string;

    color?: string;
    colorHex?: string;

    diameter?: number;

    initialWeightGrams?: number;
    remainingWeightGrams?: number;

    cost?: number;

    storageLocation?: string;

    dryingStatus: MaterialDryingStatus;

    notes?: string;

    createdAt: string;
    updatedAt: string;
}

/*
 * ---------------------------------------------------------
 * DATABASE
 * ---------------------------------------------------------
 */

let db: Database | null =
    null;

export async function getDatabase() {
    if (!db) {
        db = await Database.load(
            "sqlite:3d-printvault.db",
        );

        /*
         * ---------------------------------------------------------
         * ASSETS
         * ---------------------------------------------------------
         */

        await db.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        extension TEXT NOT NULL,
        technology TEXT NOT NULL,
        size TEXT NOT NULL,
        size_bytes INTEGER,
        modified TEXT NOT NULL,
        modified_at TEXT,
        imported_at TEXT NOT NULL,
        thumbnail_path TEXT,
        favorite INTEGER NOT NULL DEFAULT 0,
        last_opened_at TEXT,
        open_count INTEGER NOT NULL DEFAULT 0
)
    `);

        try {
            await db.execute(`
                ALTER TABLE assets
                ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0
        `);
        } catch (error) {
            /*
             * The column already exists.
             * This is expected after the migration
             * has been applied once.
             */
        }

        await db.execute(`
      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Ready',
        serial_number TEXT,
        ip_address TEXT,
        hostname TEXT,
        build_volume_x REAL,
        build_volume_y REAL,
        build_volume_z REAL,
        nozzle_size REAL,
        build_plate TEXT,
        material_system TEXT,
        connection_type TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

        await db.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        material_type TEXT NOT NULL,

        color TEXT,
        color_hex TEXT,

        diameter REAL,

        initial_weight_grams REAL,
        remaining_weight_grams REAL,

        cost REAL,

        storage_location TEXT,

        drying_status TEXT NOT NULL DEFAULT 'Unknown',

        notes TEXT,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

        await db.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Queued',

        asset_id INTEGER,
        machine_id INTEGER,
        material_id INTEGER,

        quantity INTEGER NOT NULL DEFAULT 1,

        estimated_minutes REAL,
        actual_minutes REAL,

        material_usage_grams REAL,

        notes TEXT,

        material_deducted INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (asset_id)
            REFERENCES assets(id)
            ON DELETE SET NULL,

        FOREIGN KEY (machine_id)
            REFERENCES machines(id)
            ON DELETE SET NULL,

        FOREIGN KEY (material_id)
            REFERENCES materials(id)
            ON DELETE SET NULL
    )
`);

        /*
         * Existing jobs migration.
         * Adds double-deduction protection to databases
         * created before material_deducted existed.
         */

        try {
            await db.execute(`
        ALTER TABLE jobs
        ADD COLUMN material_deducted INTEGER NOT NULL DEFAULT 0
      `);
        } catch {
            // Column already exists.
        }

        try {
            await db.execute(`
    ALTER TABLE machines
    ADD COLUMN build_plate TEXT
  `);
        } catch {
            // Column already exists.
        }

        try {
            await db.execute(`
    ALTER TABLE machines
    ADD COLUMN material_system TEXT
  `);
        } catch {
            // Column already exists.
        }

        try {
            await db.execute(`
    ALTER TABLE machines
    ADD COLUMN connection_type TEXT
  `);
        } catch {
            // Column already exists.
        }

        try {
            await db.execute(`
    ALTER TABLE machines
    ADD COLUMN hostname TEXT
  `);
        } catch {
            // Column already exists.
        }

        /*
         * Existing database migrations.
         */

        try {
            await db.execute(`
        ALTER TABLE assets
        ADD COLUMN thumbnail_path TEXT
      `);
        } catch {
            // Column already exists.
        }

        try {
            await db.execute(`
        ALTER TABLE assets
        ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0
      `);
        } catch {
            // Column already exists.
        }

        try {
            await db.execute(`
        ALTER TABLE assets
        ADD COLUMN last_opened_at TEXT
      `);
        } catch {
            // Column already exists.
        }

        /*
 * ---------------------------------------------------------
 * WATCHED FOLDERS
 * ---------------------------------------------------------
 *
 * Watched folders are directories that 3D PrintVault
 * scans for supported fabrication files.
 */

        await db.execute(`
          CREATE TABLE IF NOT EXISTS watched_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
          )
        `);

        /*
         * ---------------------------------------------------------
         * COLLECTIONS
         * ---------------------------------------------------------
         *
         * Collections are intentionally separate from assets.
         * One asset may belong to multiple collections.
         */

        await db.execute(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

        /*
         * ---------------------------------------------------------
         * ASSET <-> COLLECTION RELATIONSHIP
         * ---------------------------------------------------------
         */

        await db.execute(`
      CREATE TABLE IF NOT EXISTS asset_collections (
        asset_id INTEGER NOT NULL,
        collection_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,

        PRIMARY KEY (
          asset_id,
          collection_id
        ),

        FOREIGN KEY (
          asset_id
        )
        REFERENCES assets(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
          collection_id
        )
        REFERENCES collections(id)
        ON DELETE CASCADE
      )
    `);

        /*
     * ---------------------------------------------------------
     * CATEGORIES
     * ---------------------------------------------------------
     *
     * Categories act like virtual folders inside 3D PrintVault.
     * They do not move or duplicate the original files.
     *
     * parent_id allows nested folders later.
     */

        await db.execute(`
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,

            FOREIGN KEY (
            parent_id
            )
            REFERENCES categories(id)
            ON DELETE CASCADE
        )
        `);

        /*
         * ---------------------------------------------------------
         * ASSET <-> CATEGORY RELATIONSHIP
         * ---------------------------------------------------------
         */

        await db.execute(`
          CREATE TABLE IF NOT EXISTS asset_categories (
          asset_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,

          PRIMARY KEY (
          asset_id,
          category_id
        ),

          FOREIGN KEY (
          asset_id
        )
          REFERENCES assets(id)
          ON DELETE CASCADE,

          FOREIGN KEY (
          category_id
        )
          REFERENCES categories(id)
          ON DELETE CASCADE
        )
      `);

        /*
         * ---------------------------------------------------------
         * PROJECTS
         * ---------------------------------------------------------
         */

        await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Planning',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

        /*
         * ---------------------------------------------------------
         * ASSET <-> PROJECT RELATIONSHIP
         * ---------------------------------------------------------
         */

        await db.execute(`
      CREATE TABLE IF NOT EXISTS project_assets (
        project_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,

        PRIMARY KEY (
          project_id,
          asset_id
        ),

        FOREIGN KEY (
          project_id
        )
        REFERENCES projects(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
          asset_id
        )
        REFERENCES assets(id)
        ON DELETE CASCADE
      )
    `);

        /*
         * SQLite does not always enable foreign keys automatically.
         */

        await db.execute(`
      PRAGMA foreign_keys = ON
    `);
    }

    return db;
}

export interface WatchedFolder {
    id: number;
    path: string;
    createdAt: string;
}

export async function addWatchedFolder(
    path: string,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        INSERT OR IGNORE INTO watched_folders (
          path,
          created_at
        )
        VALUES (?, ?)
        `,
        [
            path,
            new Date().toISOString(),
        ],
    );
}

export async function loadWatchedFolders():
    Promise<WatchedFolder[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                path: string;
                created_at: string;
            }[]
        >(
            `
            SELECT
              id,
              path,
              created_at
            FROM watched_folders
            ORDER BY created_at ASC
            `,
        );

    return rows.map(
        (row) => ({
            id: row.id,
            path: row.path,
            createdAt:
                row.created_at,
        }),
    );
}

export async function removeWatchedFolder(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        DELETE FROM watched_folders
        WHERE id = ?
        `,
        [
            id,
        ],
    );
}

/*
 * ---------------------------------------------------------
 * ASSET FUNCTIONS
 * ---------------------------------------------------------
 */

export async function saveAsset(
    asset: Asset,
) {
    const database =
        await getDatabase();

    await database.execute(
        `
    INSERT OR REPLACE INTO assets (
      id,
      name,
      path,
      extension,
      technology,
      size,
      size_bytes,
      modified,
      modified_at,
      imported_at,
      thumbnail_path,
      favorite,
      last_opened_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            asset.id,
            asset.name,
            asset.path ?? "",
            asset.extension,
            asset.technology,
            asset.size,
            asset.sizeBytes ?? null,
            asset.modified,
            asset.modifiedAt ?? null,
            new Date().toISOString(),
            asset.thumbnailPath ?? null,
            asset.favorite ? 1 : 0,
            asset.lastOpenedAt ?? null,
        ],
    );
}

export async function saveAssets(
    assets: Asset[],
) {
    for (const asset of assets) {
        await saveAsset(
            asset,
        );
    }
}

export async function loadAssets(): Promise<
    Asset[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                path: string;
                extension: string;
                technology: Asset["technology"];
                size: string;
                size_bytes: number | null;
                modified: string;
                modified_at: string | null;
                imported_at: string;
                thumbnail_path: string | null;
                favorite: number;
                last_opened_at: string | null;
                open_count: number;
            }[]
        >(
            `
      SELECT
        id,
        name,
        path,
        extension,
        technology,
        size,
        size_bytes,
        modified,
        modified_at,
        imported_at,
        thumbnail_path,
        favorite,
        last_opened_at,
        open_count
        FROM assets
      ORDER BY imported_at DESC
      `,
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,
            path: row.path,
            extension:
                row.extension,
            technology:
                row.technology,
            size: row.size,

            sizeBytes:
                row.size_bytes ??
                undefined,

            modified:
                row.modified,

            modifiedAt:
                row.modified_at ??
                undefined,

            thumbnailPath:
                row.thumbnail_path ??
                undefined,

            favorite:
                row.favorite === 1,

            importedAt:
                row.imported_at,

            lastOpenedAt:
                row.last_opened_at ??
                undefined,

            openCount:
                row.open_count ?? 0,
        }),
    );
}

export async function deleteAssetById(
    id: number,
) {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM assets
    WHERE id = ?
    `,
        [
            id,
        ],
    );
}

export async function assetExistsByPath(
    path: string,
): Promise<boolean> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                count: number;
            }[]
        >(
            `
      SELECT COUNT(*) AS count
      FROM assets
      WHERE path = ?
      `,
            [
                path,
            ],
        );

    return (
        (rows[0]?.count ?? 0) >
        0
    );
}

export async function updateAssetThumbnailPath(
    id: number,
    thumbnailPath: string | null,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    UPDATE assets
    SET thumbnail_path = ?
    WHERE id = ?
    `,
        [
            thumbnailPath,
            id,
        ],
    );
}

export async function updateAssetFavorite(
    id: number,
    favorite: boolean,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    UPDATE assets
    SET favorite = ?
    WHERE id = ?
    `,
        [
            favorite
                ? 1
                : 0,
            id,
        ],
    );
}

export async function updateAssetLastOpenedAt(
    id: number,
    lastOpenedAt:
        string | null,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    UPDATE assets
    SET last_opened_at = ?
    WHERE id = ?
    `,
        [
            lastOpenedAt,
            id,
        ],
    );
}

export async function incrementAssetOpenCount(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        UPDATE assets
        SET open_count = open_count + 1
        WHERE id = ?
        `,
        [
            id,
        ],
    );
}

/*
 * ---------------------------------------------------------
 * COLLECTION FUNCTIONS
 * ---------------------------------------------------------
 */

export async function createCollection(
    name: string,
): Promise<Collection> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (
        !trimmedName
    ) {
        throw new Error(
            "Collection name cannot be empty.",
        );
    }

    const now =
        new Date().toISOString();

    const result =
        await database.execute(
            `
      INSERT INTO collections (
        name,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?)
      `,
            [
                trimmedName,
                now,
                now,
            ],
        );

    const id =
        Number(
            result.lastInsertId,
        );

    if (
        !Number.isFinite(
            id,
        )
    ) {
        throw new Error(
            "Unable to determine the new collection ID.",
        );
    }

    return {
        id,
        name: trimmedName,
        createdAt: now,
        updatedAt: now,
        assetCount: 0,
    };
}

export async function loadCollections(): Promise<
    Collection[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                created_at: string;
                updated_at: string;
                asset_count: number;
            }[]
        >(
            `
      SELECT
        collections.id,
        collections.name,
        collections.created_at,
        collections.updated_at,
        COUNT(
          asset_collections.asset_id
        ) AS asset_count
      FROM collections
      LEFT JOIN asset_collections
        ON asset_collections.collection_id =
          collections.id
      GROUP BY
        collections.id,
        collections.name,
        collections.created_at,
        collections.updated_at
      ORDER BY
        collections.name COLLATE NOCASE ASC
      `,
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,

            assetCount:
                Number(
                    row.asset_count,
                ),
        }),
    );
}

/*
 * ---------------------------------------------------------
 * CATEGORY FUNCTIONS
 * ---------------------------------------------------------
 */

export async function createCategory(
    name: string,
    parentId?: number,
): Promise<Category> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (!trimmedName) {
        throw new Error(
            "Category name cannot be empty.",
        );
    }

    const now =
        new Date().toISOString();

    const result =
        await database.execute(
            `
            INSERT INTO categories (
                name,
                parent_id,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                trimmedName,
                parentId ?? null,
                now,
                now,
            ],
        );

    const id =
        Number(
            result.lastInsertId,
        );

    if (
        !Number.isFinite(
            id,
        )
    ) {
        throw new Error(
            "Unable to determine the new category ID.",
        );
    }

    return {
        id,
        name:
            trimmedName,
        parentId,
        createdAt:
            now,
        updatedAt:
            now,
        assetCount:
            0,
        childCount:
            0,
    };
}

export async function loadCategories(
    parentId?: number,
): Promise<Category[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                parent_id: number | null;
                created_at: string;
                updated_at: string;
                asset_count: number;
                child_count: number;
            }[]
        >(
            `
            SELECT
                categories.id,
                categories.name,
                categories.parent_id,
                categories.created_at,
                categories.updated_at,

                (
                    SELECT COUNT(*)
                    FROM asset_categories
                    WHERE
                        asset_categories.category_id =
                        categories.id
                ) AS asset_count,

                (
                    SELECT COUNT(*)
                    FROM categories AS children
                    WHERE
                        children.parent_id =
                        categories.id
                ) AS child_count

            FROM categories

            WHERE
                (
                    ? IS NULL
                    AND categories.parent_id IS NULL
                )
                OR
                categories.parent_id = ?

            ORDER BY
                categories.name COLLATE NOCASE ASC
            `,
            [
                parentId ?? null,
                parentId ?? null,
            ],
        );

    return rows.map(
        (row) => ({
            id:
                row.id,

            name:
                row.name,

            parentId:
                row.parent_id ??
                undefined,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,

            assetCount:
                Number(
                    row.asset_count,
                ),

            childCount:
                Number(
                    row.child_count,
                ),
        }),
    );
}

export async function loadAllCategories():
    Promise<Category[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                parent_id: number | null;
                created_at: string;
                updated_at: string;
                asset_count: number;
                child_count: number;
            }[]
        >(
            `
            SELECT
                categories.id,
                categories.name,
                categories.parent_id,
                categories.created_at,
                categories.updated_at,

                (
                    SELECT COUNT(*)
                    FROM asset_categories
                    WHERE
                        asset_categories.category_id =
                        categories.id
                ) AS asset_count,

                (
                    SELECT COUNT(*)
                    FROM categories AS children
                    WHERE
                        children.parent_id =
                        categories.id
                ) AS child_count

            FROM categories

            ORDER BY
                categories.name COLLATE NOCASE ASC
            `,
        );

    return rows.map(
        (row) => ({
            id:
                row.id,

            name:
                row.name,

            parentId:
                row.parent_id ??
                undefined,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,

            assetCount:
                Number(
                    row.asset_count,
                ),

            childCount:
                Number(
                    row.child_count,
                ),
        }),
    );
}

export async function renameCategory(
    id: number,
    name: string,
): Promise<void> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (!trimmedName) {
        throw new Error(
            "Category name cannot be empty.",
        );
    }

    await database.execute(
        `
        UPDATE categories
        SET
            name = ?,
            updated_at = ?
        WHERE id = ?
        `,
        [
            trimmedName,
            new Date().toISOString(),
            id,
        ],
    );
}

export async function deleteCategory(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        DELETE FROM categories
        WHERE id = ?
        `,
        [
            id,
        ],
    );
}

/*
 * ---------------------------------------------------------
 * CATEGORY DETAIL
 * ---------------------------------------------------------
 */

export async function loadCategoryById(
    id: number,
): Promise<Category | null> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                parent_id: number | null;
                created_at: string;
                updated_at: string;
                asset_count: number;
                child_count: number;
            }[]
        >(
            `
            SELECT
                categories.id,
                categories.name,
                categories.parent_id,
                categories.created_at,
                categories.updated_at,

                (
                    SELECT COUNT(*)
                    FROM asset_categories
                    WHERE
                        asset_categories.category_id =
                        categories.id
                ) AS asset_count,

                (
                    SELECT COUNT(*)
                    FROM categories AS children
                    WHERE
                        children.parent_id =
                        categories.id
                ) AS child_count

            FROM categories

            WHERE
                categories.id = ?

            LIMIT 1
            `,
            [
                id,
            ],
        );

    const row =
        rows[0];

    if (!row) {
        return null;
    }

    return {
        id:
            row.id,

        name:
            row.name,

        parentId:
            row.parent_id ??
            undefined,

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at,

        assetCount:
            Number(
                row.asset_count,
            ),

        childCount:
            Number(
                row.child_count,
            ),
    };
}

export async function loadChildCategories(
    parentId: number,
): Promise<Category[]> {
    return loadCategories(
        parentId,
    );
}

export async function addAssetToCategory(
    assetId: number,
    categoryId: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        INSERT OR IGNORE INTO asset_categories (
            asset_id,
            category_id,
            created_at
        )
        VALUES (?, ?, ?)
        `,
        [
            assetId,
            categoryId,
            new Date().toISOString(),
        ],
    );

    await database.execute(
        `
        UPDATE categories
        SET updated_at = ?
        WHERE id = ?
        `,
        [
            new Date().toISOString(),
            categoryId,
        ],
    );
}

export async function removeAssetFromCategory(
    assetId: number,
    categoryId: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        DELETE FROM asset_categories
        WHERE
            asset_id = ?
            AND category_id = ?
        `,
        [
            assetId,
            categoryId,
        ],
    );

    await database.execute(
        `
        UPDATE categories
        SET updated_at = ?
        WHERE id = ?
        `,
        [
            new Date().toISOString(),
            categoryId,
        ],
    );
}

export async function loadAssetsForCategory(
    categoryId: number,
): Promise<Asset[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                path: string;
                extension: string;
                technology: Asset["technology"];
                size: string;
                size_bytes: number | null;
                modified: string;
                modified_at: string | null;
                imported_at: string;
                thumbnail_path: string | null;
                favorite: number;
                last_opened_at: string | null;
                open_count: number;
            }[]
        >(
            `
            SELECT
                assets.id,
                assets.name,
                assets.path,
                assets.extension,
                assets.technology,
                assets.size,
                assets.size_bytes,
                assets.modified,
                assets.modified_at,
                assets.imported_at,
                assets.thumbnail_path,
                assets.favorite,
                assets.last_opened_at,
                assets.open_count

            FROM assets

            INNER JOIN asset_categories
                ON asset_categories.asset_id =
                    assets.id

            WHERE
                asset_categories.category_id = ?

            ORDER BY
                asset_categories.created_at DESC
            `,
            [
                categoryId,
            ],
        );

    return rows.map(
        (row) => ({
            id:
                row.id,

            name:
                row.name,

            path:
                row.path,

            extension:
                row.extension,

            technology:
                row.technology,

            size:
                row.size,

            sizeBytes:
                row.size_bytes ??
                undefined,

            modified:
                row.modified,

            modifiedAt:
                row.modified_at ??
                undefined,

            importedAt:
                row.imported_at,

            thumbnailPath:
                row.thumbnail_path ??
                undefined,

            favorite:
                row.favorite === 1,

            lastOpenedAt:
                row.last_opened_at ??
                undefined,

            openCount:
                row.open_count ?? 0,
        }),
    );
}

export async function categoryIsAssignedToAsset(
    categoryId: number,
    assetId: number,
): Promise<boolean> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                count: number;
            }[]
        >(
            `
            SELECT COUNT(*) AS count
            FROM asset_categories
            WHERE
                category_id = ?
                AND asset_id = ?
            `,
            [
                categoryId,
                assetId,
            ],
        );

    return (
        (rows[0]?.count ?? 0) >
        0
    );
}

/*
 * ---------------------------------------------------------
 * COLLECTION PREVIEWS
 * ---------------------------------------------------------
 */

export interface CollectionPreviewAsset {
    id: number;
    name: string;
    extension: string;
    thumbnailPath?: string;
}

export async function loadCollectionPreviewAssets(
    collectionId: number,
    limit = 4,
): Promise<
    CollectionPreviewAsset[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                extension: string;
                thumbnail_path: string | null;
            }[]
        >(
            `
      SELECT
        assets.id,
        assets.name,
        assets.extension,
        assets.thumbnail_path
      FROM assets
      INNER JOIN asset_collections
        ON asset_collections.asset_id =
          assets.id
      WHERE
        asset_collections.collection_id = ?
      ORDER BY
        asset_collections.created_at DESC
      LIMIT ?
      `,
            [
                collectionId,
                limit,
            ],
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,

            extension:
                row.extension,

            thumbnailPath:
                row.thumbnail_path ??
                undefined,
        }),
    );
}

export async function renameCollection(
    id: number,
    name: string,
): Promise<void> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (
        !trimmedName
    ) {
        throw new Error(
            "Collection name cannot be empty.",
        );
    }

    await database.execute(
        `
    UPDATE collections
    SET
      name = ?,
      updated_at = ?
    WHERE id = ?
    `,
        [
            trimmedName,
            new Date().toISOString(),
            id,
        ],
    );
}

export async function deleteCollection(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM collections
    WHERE id = ?
    `,
        [
            id,
        ],
    );
}

/*
 * ---------------------------------------------------------
 * ASSET COLLECTION MEMBERSHIP
 * ---------------------------------------------------------
 */

export async function addAssetToCollection(
    assetId: number,
    collectionId: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    INSERT OR IGNORE INTO asset_collections (
      asset_id,
      collection_id,
      created_at
    )
    VALUES (?, ?, ?)
    `,
        [
            assetId,
            collectionId,
            new Date().toISOString(),
        ],
    );

    await database.execute(
        `
    UPDATE collections
    SET updated_at = ?
    WHERE id = ?
    `,
        [
            new Date().toISOString(),
            collectionId,
        ],
    );
}

export async function removeAssetFromCollection(
    assetId: number,
    collectionId: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM asset_collections
    WHERE
      asset_id = ?
      AND collection_id = ?
    `,
        [
            assetId,
            collectionId,
        ],
    );

    await database.execute(
        `
    UPDATE collections
    SET updated_at = ?
    WHERE id = ?
    `,
        [
            new Date().toISOString(),
            collectionId,
        ],
    );
}

export async function loadAssetsForCollection(
    collectionId: number,
): Promise<Asset[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                path: string;
                extension: string;
                technology: Asset["technology"];
                size: string;
                size_bytes: number | null;
                modified: string;
                modified_at: string | null;
                imported_at: string;
                thumbnail_path: string | null;
                favorite: number;
                last_opened_at: string | null;
                open_count: number;
            }[]
        >(
            `
      SELECT
        assets.id,
        assets.name,
        assets.path,
        assets.extension,
        assets.technology,
        assets.size,
        assets.size_bytes,
        assets.modified,
        assets.modified_at,
        assets.thumbnail_path,
        assets.favorite,
        assets.last_opened_at
      FROM assets
      INNER JOIN asset_collections
        ON asset_collections.asset_id =
          assets.id
      WHERE
        asset_collections.collection_id = ?
      ORDER BY
        assets.name COLLATE NOCASE ASC
      `,
            [
                collectionId,
            ],
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,
            path: row.path,

            extension:
                row.extension,

            technology:
                row.technology,

            size:
                row.size,

            sizeBytes:
                row.size_bytes ??
                undefined,

            modified:
                row.modified,

            modifiedAt:
                row.modified_at ??
                undefined,

            thumbnailPath:
                row.thumbnail_path ??
                undefined,

            favorite:
                row.favorite === 1,

            lastOpenedAt:
                row.last_opened_at ??
                undefined,
        }),
    );
}

export async function loadCollectionsForAsset(
    assetId: number,
): Promise<Collection[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                created_at: string;
                updated_at: string;
            }[]
        >(
            `
      SELECT
        collections.id,
        collections.name,
        collections.created_at,
        collections.updated_at
      FROM collections
      INNER JOIN asset_collections
        ON asset_collections.collection_id =
          collections.id
      WHERE
        asset_collections.asset_id = ?
      ORDER BY
        collections.name COLLATE NOCASE ASC
      `,
            [
                assetId,
            ],
        );

    return rows.map(
        (row) => ({
            id:
                row.id,

            name:
                row.name,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,
        }),
    );
}

export async function assetIsInCollection(
    assetId: number,
    collectionId: number,
): Promise<boolean> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                count: number;
            }[]
        >(
            `
      SELECT COUNT(*) AS count
      FROM asset_collections
      WHERE
        asset_id = ?
        AND collection_id = ?
      `,
            [
                assetId,
                collectionId,
            ],
        );

    return (
        (rows[0]?.count ?? 0) >
        0
    );
}

/*
 * ---------------------------------------------------------
 * PROJECT FUNCTIONS
 * ---------------------------------------------------------
 */

export async function createProject(
    name: string,
    description = "",
): Promise<Project> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (!trimmedName) {
        throw new Error(
            "Project name cannot be empty.",
        );
    }

    const now =
        new Date().toISOString();

    const result =
        await database.execute(
            `
      INSERT INTO projects (
        name,
        description,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      `,
            [
                trimmedName,
                description.trim() || null,
                "Planning",
                now,
                now,
            ],
        );

    const id =
        Number(
            result.lastInsertId,
        );

    if (!Number.isFinite(id)) {
        throw new Error(
            "Unable to determine the new project ID.",
        );
    }

    return {
        id,
        name: trimmedName,
        description:
            description.trim() ||
            undefined,
        status: "Planning",
        createdAt: now,
        updatedAt: now,
        assetCount: 0,
    };
}

export async function loadProjects(): Promise<
    Project[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                description: string | null;
                status: ProjectStatus;
                created_at: string;
                updated_at: string;
                asset_count: number;
            }[]
        >(
            `
      SELECT
        projects.id,
        projects.name,
        projects.description,
        projects.status,
        projects.created_at,
        projects.updated_at,
        COUNT(
          project_assets.asset_id
        ) AS asset_count
      FROM projects
      LEFT JOIN project_assets
        ON project_assets.project_id =
          projects.id
      GROUP BY
        projects.id,
        projects.name,
        projects.description,
        projects.status,
        projects.created_at,
        projects.updated_at
      ORDER BY
        projects.updated_at DESC
      `,
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,

            description:
                row.description ??
                undefined,

            status:
                row.status,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,

            assetCount:
                Number(
                    row.asset_count,
                ),
        }),
    );
}

export async function renameProject(
    id: number,
    name: string,
): Promise<void> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (!trimmedName) {
        throw new Error(
            "Project name cannot be empty.",
        );
    }

    await database.execute(
        `
    UPDATE projects
    SET
      name = ?,
      updated_at = ?
    WHERE id = ?
    `,
        [
            trimmedName,
            new Date().toISOString(),
            id,
        ],
    );
}

export async function updateProjectDescription(
    id: number,
    description: string,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    UPDATE projects
    SET
      description = ?,
      updated_at = ?
    WHERE id = ?
    `,
        [
            description.trim() || null,
            new Date().toISOString(),
            id,
        ],
    );
}

export async function updateProjectStatus(
    id: number,
    status: ProjectStatus,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    UPDATE projects
    SET
      status = ?,
      updated_at = ?
    WHERE id = ?
    `,
        [
            status,
            new Date().toISOString(),
            id,
        ],
    );
}

export async function deleteProject(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM projects
    WHERE id = ?
    `,
        [
            id,
        ],
    );
}

/*
 * ---------------------------------------------------------
 * PROJECT ASSET MEMBERSHIP
 * ---------------------------------------------------------
 */

export async function addAssetToProject(
    assetId: number,
    projectId: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    INSERT OR IGNORE INTO project_assets (
      project_id,
      asset_id,
      created_at
    )
    VALUES (?, ?, ?)
    `,
        [
            projectId,
            assetId,
            new Date().toISOString(),
        ],
    );

    await database.execute(
        `
    UPDATE projects
    SET updated_at = ?
    WHERE id = ?
    `,
        [
            new Date().toISOString(),
            projectId,
        ],
    );
}

export async function removeAssetFromProject(
    assetId: number,
    projectId: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM project_assets
    WHERE
      project_id = ?
      AND asset_id = ?
    `,
        [
            projectId,
            assetId,
        ],
    );

    await database.execute(
        `
    UPDATE projects
    SET updated_at = ?
    WHERE id = ?
    `,
        [
            new Date().toISOString(),
            projectId,
        ],
    );
}

export async function loadAssetsForProject(
    projectId: number,
): Promise<Asset[]> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                path: string;
                extension: string;
                technology: Asset["technology"];
                size: string;
                size_bytes: number | null;
                modified: string;
                modified_at: string | null;
                thumbnail_path: string | null;
                favorite: number;
                last_opened_at: string | null;
            }[]
        >(
            `
      SELECT
        assets.id,
        assets.name,
        assets.path,
        assets.extension,
        assets.technology,
        assets.size,
        assets.size_bytes,
        assets.modified,
        assets.modified_at,
        assets.thumbnail_path,
        assets.favorite,
        assets.last_opened_at
      FROM assets
      INNER JOIN project_assets
        ON project_assets.asset_id =
          assets.id
      WHERE
        project_assets.project_id = ?
      ORDER BY
        project_assets.created_at DESC
      `,
            [
                projectId,
            ],
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,
            path: row.path,
            extension:
                row.extension,
            technology:
                row.technology,
            size: row.size,

            sizeBytes:
                row.size_bytes ??
                undefined,

            modified:
                row.modified,

            modifiedAt:
                row.modified_at ??
                undefined,

            thumbnailPath:
                row.thumbnail_path ??
                undefined,

            favorite:
                row.favorite === 1,

            lastOpenedAt:
                row.last_opened_at ??
                undefined,
        }),
    );
}

export async function projectIsAssignedToAsset(
    projectId: number,
    assetId: number,
): Promise<boolean> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                count: number;
            }[]
        >(
            `
      SELECT COUNT(*) AS count
      FROM project_assets
      WHERE
        project_id = ?
        AND asset_id = ?
      `,
            [
                projectId,
                assetId,
            ],
        );

    return (
        (rows[0]?.count ?? 0) >
        0
    );
}

export async function createMachine(
    name: string,
    manufacturer: string,
    model: string,
    type: MachineType,
): Promise<Machine> {
    const database =
        await getDatabase();

    const now =
        new Date().toISOString();

    const result =
        await database.execute(
            `
      INSERT INTO machines (
        name,
        manufacturer,
        model,
        type,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                name.trim(),
                manufacturer.trim(),
                model.trim(),
                type,
                "Ready",
                now,
                now,
            ],
        );

    return {
        id: Number(
            result.lastInsertId,
        ),
        name: name.trim(),
        manufacturer:
            manufacturer.trim(),
        model: model.trim(),
        type,
        status: "Ready",
        createdAt: now,
        updatedAt: now,
    };
}

export async function loadMachines(): Promise<
    Machine[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;
                name: string;
                manufacturer: string;
                model: string;
                type: MachineType;
                status: MachineStatus;
                serial_number: string | null;
                ip_address: string | null;
                build_volume_x: number | null;
                build_volume_y: number | null;
                build_volume_z: number | null;
                nozzle_size: number | null;
                notes: string | null;
                created_at: string;
                updated_at: string;
                hostname: string | null;
                build_plate: string | null;
                material_system: MaterialSystem | null;
                connection_type: ConnectionType | null;
            }[]
        >(
            `
      SELECT
        id,
        name,
        manufacturer,
        model,
        type,
        status,
        serial_number,
        ip_address,
        build_volume_x,
        build_volume_y,
        build_volume_z,
        nozzle_size,
        notes,
        created_at,
        updated_at,
        hostname,
        build_plate,
        material_system,
        connection_type
      FROM machines
      ORDER BY created_at DESC
      `,
        );

    return rows.map(
        (row) => ({
            id: row.id,
            name: row.name,
            manufacturer:
                row.manufacturer,
            model: row.model,
            type: row.type,
            status: row.status,
            serialNumber:
                row.serial_number ??
                undefined,
            ipAddress:
                row.ip_address ??
                undefined,
            buildVolumeX:
                row.build_volume_x ??
                undefined,
            buildVolumeY:
                row.build_volume_y ??
                undefined,
            buildVolumeZ:
                row.build_volume_z ??
                undefined,
            nozzleSize:
                row.nozzle_size ??
                undefined,
            notes:
                row.notes ??
                undefined,
            createdAt:
                row.created_at,
            updatedAt:
                row.updated_at,
            hostname:
                row.hostname ??
                undefined,

            buildPlate:
                row.build_plate ??
                undefined,

            materialSystem:
                row.material_system ??
                undefined,

            connectionType:
                row.connection_type ??
                undefined,
        }),
    );
}

export async function updateMachine(
    machine: Machine,
): Promise<void> {
    const database =
        await getDatabase();

    const trimmedName =
        machine.name.trim();

    const trimmedManufacturer =
        machine.manufacturer.trim();

    const trimmedModel =
        machine.model.trim();

    if (!trimmedName) {
        throw new Error(
            "Machine name cannot be empty.",
        );
    }

    if (!trimmedManufacturer) {
        throw new Error(
            "Manufacturer cannot be empty.",
        );
    }

    if (!trimmedModel) {
        throw new Error(
            "Model cannot be empty.",
        );
    }

    await database.execute(
        `
    UPDATE machines
SET
  name = ?,
  manufacturer = ?,
  model = ?,
  type = ?,
  status = ?,
  serial_number = ?,
  ip_address = ?,
  hostname = ?,
  build_volume_x = ?,
  build_volume_y = ?,
  build_volume_z = ?,
  nozzle_size = ?,
  build_plate = ?,
  material_system = ?,
  connection_type = ?,
  notes = ?,
  updated_at = ?
WHERE id = ?
    `,
        [
            trimmedName,
            trimmedManufacturer,
            trimmedModel,
            machine.type,
            machine.status,

            machine.serialNumber?.trim() ||
            null,

            machine.ipAddress?.trim() ||
            null,

            machine.hostname?.trim() ||
            null,

            machine.buildVolumeX ??
            null,

            machine.buildVolumeY ??
            null,

            machine.buildVolumeZ ??
            null,

            machine.nozzleSize ??
            null,

            machine.buildPlate?.trim() ||
            null,

            machine.materialSystem ??
            null,

            machine.connectionType ??
            null,

            machine.notes?.trim() ||
            null,

            new Date().toISOString(),
            machine.id,
        ]
    );
}

export async function deleteMachine(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM machines
    WHERE id = ?
    `,
        [id],
    );
}

export async function createMaterial(
    name: string,
    brand: string,
    category: MaterialCategory,
    materialType: string,
): Promise<Material> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    const trimmedBrand =
        brand.trim();

    const trimmedMaterialType =
        materialType.trim();

    if (!trimmedName) {
        throw new Error(
            "Material name cannot be empty.",
        );
    }

    if (!trimmedBrand) {
        throw new Error(
            "Material brand cannot be empty.",
        );
    }

    if (!trimmedMaterialType) {
        throw new Error(
            "Material type cannot be empty.",
        );
    }

    const now =
        new Date().toISOString();

    const result =
        await database.execute(
            `
      INSERT INTO materials (
        name,
        brand,
        category,
        material_type,
        drying_status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                trimmedName,
                trimmedBrand,
                category,
                trimmedMaterialType,
                "Unknown",
                now,
                now,
            ],
        );

    return {
        id: Number(
            result.lastInsertId,
        ),

        name:
            trimmedName,

        brand:
            trimmedBrand,

        category,

        materialType:
            trimmedMaterialType,

        dryingStatus:
            "Unknown",

        createdAt:
            now,

        updatedAt:
            now,
    };
}

export async function loadMaterials(): Promise<
    Material[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;

                name: string;
                brand: string;
                category: MaterialCategory;
                material_type: string;

                color: string | null;
                color_hex: string | null;

                diameter: number | null;

                initial_weight_grams:
                number | null;

                remaining_weight_grams:
                number | null;

                cost: number | null;

                storage_location:
                string | null;

                drying_status:
                MaterialDryingStatus;

                notes: string | null;

                created_at: string;
                updated_at: string;
            }[]
        >(
            `
      SELECT
        id,
        name,
        brand,
        category,
        material_type,
        color,
        color_hex,
        diameter,
        initial_weight_grams,
        remaining_weight_grams,
        cost,
        storage_location,
        drying_status,
        notes,
        created_at,
        updated_at
      FROM materials
      ORDER BY created_at DESC
      `,
        );

    return rows.map(
        (row) => ({
            id:
                row.id,

            name:
                row.name,

            brand:
                row.brand,

            category:
                row.category,

            materialType:
                row.material_type,

            color:
                row.color ??
                undefined,

            colorHex:
                row.color_hex ??
                undefined,

            diameter:
                row.diameter ??
                undefined,

            initialWeightGrams:
                row.initial_weight_grams ??
                undefined,

            remainingWeightGrams:
                row.remaining_weight_grams ??
                undefined,

            cost:
                row.cost ??
                undefined,

            storageLocation:
                row.storage_location ??
                undefined,

            dryingStatus:
                row.drying_status,

            notes:
                row.notes ??
                undefined,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,
        }),
    );
}

export async function updateMaterial(
    material: Material,
): Promise<void> {
    const database =
        await getDatabase();

    const trimmedName =
        material.name.trim();

    const trimmedBrand =
        material.brand.trim();

    const trimmedMaterialType =
        material.materialType.trim();

    if (!trimmedName) {
        throw new Error(
            "Material name cannot be empty.",
        );
    }

    if (!trimmedBrand) {
        throw new Error(
            "Material brand cannot be empty.",
        );
    }

    if (!trimmedMaterialType) {
        throw new Error(
            "Material type cannot be empty.",
        );
    }

    await database.execute(
        `
        UPDATE materials
        SET
            name = ?,
            brand = ?,
            category = ?,
            material_type = ?,
            color = ?,
            color_hex = ?,
            diameter = ?,
            initial_weight_grams = ?,
            remaining_weight_grams = ?,
            cost = ?,
            storage_location = ?,
            drying_status = ?,
            notes = ?,
            updated_at = ?
        WHERE id = ?
        `,
        [
            trimmedName,
            trimmedBrand,
            material.category,
            trimmedMaterialType,

            material.color?.trim() ||
            null,

            material.colorHex?.trim() ||
            null,

            material.diameter ??
            null,

            material.initialWeightGrams ??
            null,

            material.remainingWeightGrams ??
            null,

            material.cost ??
            null,

            material.storageLocation?.trim() ||
            null,

            material.dryingStatus,

            material.notes?.trim() ||
            null,

            new Date().toISOString(),

            material.id,
        ],
    );
}

export async function deleteMaterial(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
    DELETE FROM materials
    WHERE id = ?
    `,
        [
            id,
        ],
    );
}

export type JobStatus =
    | "Queued"
    | "Preparing"
    | "Printing"
    | "Paused"
    | "Completed"
    | "Failed"
    | "Cancelled";

export interface Job {
    id: number;

    name: string;
    status: JobStatus;

    assetId?: number;
    machineId?: number;
    materialId?: number;

    quantity: number;

    estimatedMinutes?: number;
    actualMinutes?: number;

    materialUsageGrams?: number;

    notes?: string;

    materialDeducted: boolean;

    createdAt: string;
    updatedAt: string;
}

export async function createJob(
    name: string,
): Promise<Job> {
    const database =
        await getDatabase();

    const trimmedName =
        name.trim();

    if (!trimmedName) {
        throw new Error(
            "Job name cannot be empty.",
        );
    }

    const now =
        new Date().toISOString();

    const result =
        await database.execute(
            `
            INSERT INTO jobs (
                name,
                status,
                quantity,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                trimmedName,
                "Queued",
                1,
                now,
                now,
            ],
        );

    return {
        id: Number(
            result.lastInsertId,
        ),

        name:
            trimmedName,

        status:
            "Queued",

        quantity:
            1,

        materialDeducted:
            false,

        createdAt:
            now,

        updatedAt:
            now,
    };
}

export async function loadJobs(): Promise<
    Job[]
> {
    const database =
        await getDatabase();

    const rows =
        await database.select<
            {
                id: number;

                name: string;
                status: JobStatus;

                asset_id: number | null;
                machine_id: number | null;
                material_id: number | null;

                quantity: number;

                estimated_minutes:
                number | null;

                actual_minutes:
                number | null;

                material_usage_grams:
                number | null;

                notes:
                string | null;

                material_deducted:
                number;

                created_at: string;
                updated_at: string;
            }[]
        >(
            `
            SELECT
                id,
                name,
                status,
                asset_id,
                machine_id,
                material_id,
                quantity,
                estimated_minutes,
                actual_minutes,
                material_usage_grams,
                notes,
                material_deducted,
                created_at,
                updated_at
            FROM jobs
            ORDER BY created_at DESC
            `,
        );

    return rows.map(
        (row) => ({
            id:
                row.id,

            name:
                row.name,

            status:
                row.status,

            assetId:
                row.asset_id ??
                undefined,

            machineId:
                row.machine_id ??
                undefined,

            materialId:
                row.material_id ??
                undefined,

            quantity:
                row.quantity,

            estimatedMinutes:
                row.estimated_minutes ??
                undefined,

            actualMinutes:
                row.actual_minutes ??
                undefined,

            materialUsageGrams:
                row.material_usage_grams ??
                undefined,

            notes:
                row.notes ??
                undefined,

            materialDeducted:
                row.material_deducted === 1,

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at,
        }),
    );
}

export async function updateJob(
    job: Job,
): Promise<void> {
    const database =
        await getDatabase();

    const trimmedName =
        job.name.trim();

    if (!trimmedName) {
        throw new Error(
            "Job name cannot be empty.",
        );
    }

    if (
        !Number.isInteger(
            job.quantity,
        ) ||
        job.quantity < 1
    ) {
        throw new Error(
            "Job quantity must be at least 1.",
        );
    }

    await database.execute(
        `
        UPDATE jobs
        SET
            name = ?,
            status = ?,
            asset_id = ?,
            machine_id = ?,
            material_id = ?,
            quantity = ?,
            estimated_minutes = ?,
            actual_minutes = ?,
            material_usage_grams = ?,
            notes = ?,
            material_deducted = ?,
            updated_at = ?
        WHERE id = ?
        `,
        [
            trimmedName,

            job.status,

            job.assetId ??
            null,

            job.machineId ??
            null,

            job.materialId ??
            null,

            job.quantity,

            job.estimatedMinutes ??
            null,

            job.actualMinutes ??
            null,

            job.materialUsageGrams ??
            null,

            job.notes?.trim() ||
            null,

            job.materialDeducted
                ? 1
                : 0,

            new Date().toISOString(),

            job.id,
        ],
    );
}

export async function deleteJob(
    id: number,
): Promise<void> {
    const database =
        await getDatabase();

    await database.execute(
        `
        DELETE FROM jobs
        WHERE id = ?
        `,
        [
            id,
        ],
    );
}