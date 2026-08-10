import Database from "@tauri-apps/plugin-sql";
import type { Asset } from "../features/library/types/asset";

let db: Database | null = null;

export async function getDatabase() {
    if (!db) {
        db = await Database.load("sqlite:3d-printvault.db");

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
        imported_at TEXT NOT NULL
      )
    `);
    }

    return db;
}

export async function saveAsset(asset: Asset) {
    const database = await getDatabase();

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
        imported_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ],
    );
}

export async function saveAssets(assets: Asset[]) {
    for (const asset of assets) {
        await saveAsset(asset);
    }
}

export async function loadAssets(): Promise<Asset[]> {
    const database = await getDatabase();

    const rows = await database.select<
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
        modified_at
      FROM assets
      ORDER BY imported_at DESC
    `,
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        path: row.path,
        extension: row.extension,
        technology: row.technology,
        size: row.size,
        sizeBytes: row.size_bytes ?? undefined,
        modified: row.modified,
        modifiedAt: row.modified_at ?? undefined,
    }));
}