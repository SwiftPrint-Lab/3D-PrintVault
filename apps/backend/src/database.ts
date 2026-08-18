import {
    mkdirSync,
} from "node:fs";

import {
    dirname,
    resolve,
} from "node:path";

import Database
    from "better-sqlite3";

import {
    config,
} from "./config.js";

const databasePath =
    resolve(
        config.databasePath,
    );

mkdirSync(
    dirname(
        databasePath,
    ),
    {
        recursive:
            true,
    },
);

export const database =
    new Database(
        databasePath,
    );

database.pragma(
    "journal_mode = WAL",
);

database.pragma(
    "foreign_keys = ON",
);

database.exec(`
    CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        key_hash TEXT NOT NULL UNIQUE,

        email TEXT NOT NULL,

        plan TEXT NOT NULL,

        status TEXT NOT NULL DEFAULT 'active',

        max_devices INTEGER NOT NULL DEFAULT 1,

        expires_at TEXT,

        created_at TEXT NOT NULL,

        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        license_id INTEGER NOT NULL,

        device_id TEXT NOT NULL,

        device_name TEXT,

        token_hash TEXT NOT NULL UNIQUE,

        activated_at TEXT NOT NULL,

        last_validated_at TEXT NOT NULL,

        deactivated_at TEXT,

        FOREIGN KEY (
            license_id
        )
        REFERENCES licenses(id)
        ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS
        active_license_device_unique
    ON activations (
        license_id,
        device_id
    )
    WHERE deactivated_at IS NULL;

    CREATE INDEX IF NOT EXISTS
        activations_license_id_index
    ON activations (
        license_id
    );

    CREATE INDEX IF NOT EXISTS
        activations_token_hash_index
    ON activations (
        token_hash
    );
`);