use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

/*
 * ---------------------------------------------------------
 * BASIC TEST COMMAND
 * ---------------------------------------------------------
 */

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/*
 * ---------------------------------------------------------
 * 3MF EMBEDDED THUMBNAIL EXTRACTION
 * ---------------------------------------------------------
 */

#[tauri::command]
fn extract_3mf_thumbnail(path: String) -> Result<Vec<u8>, String> {
    let file = File::open(&path).map_err(|error| format!("Failed to open 3MF file: {error}"))?;

    let mut archive = zip::ZipArchive::new(file)
        .map_err(|error| format!("Failed to read 3MF archive: {error}"))?;

    let thumbnail_candidates = [
        "Metadata/plate_1_small.png",
        "Metadata/plate_1.png",
        "Metadata/top_1.png",
        "Metadata/pick_1.png",
        "Metadata/plate_no_light_1.png",
    ];

    for candidate in thumbnail_candidates {
        if let Ok(mut thumbnail) = archive.by_name(candidate) {
            let mut bytes = Vec::new();

            thumbnail.read_to_end(&mut bytes).map_err(|error| {
                format!(
                    "Failed to read embedded thumbnail \
                         {candidate}: {error}"
                )
            })?;

            return Ok(bytes);
        }
    }

    Err("No embedded 3MF thumbnail was found.".to_string())
}

/*
 * ---------------------------------------------------------
 * STL / OBJ THUMBNAIL CACHE
 * ---------------------------------------------------------
 */

#[tauri::command]
fn save_model_thumbnail(
    app: tauri::AppHandle,
    asset_id: i64,
    bytes: Vec<u8>,
) -> Result<String, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("Failed to resolve app cache directory: {error}"))?;

    let thumbnail_dir = cache_dir.join("model-thumbnails");

    fs::create_dir_all(&thumbnail_dir)
        .map_err(|error| format!("Failed to create thumbnail cache directory: {error}"))?;

    let thumbnail_path = thumbnail_dir.join(format!("asset-{asset_id}.png"));

    fs::write(&thumbnail_path, bytes)
        .map_err(|error| format!("Failed to save model thumbnail: {error}"))?;

    Ok(thumbnail_path.to_string_lossy().to_string())
}

/*
 * ---------------------------------------------------------
 * OPEN FILE IN EXTERNAL APPLICATION
 * ---------------------------------------------------------
 */

#[tauri::command]
fn open_in_application(path: String, application_path: String) -> Result<(), String> {
    let status = Command::new("open")
        .arg("-a")
        .arg(&application_path)
        .arg(&path)
        .status()
        .map_err(|error| {
            format!(
                "Failed to launch application at \
                     {application_path}: {error}"
            )
        })?;

    if !status.success() {
        return Err(format!(
            "Application at {application_path} \
                 could not open the selected file."
        ));
    }

    Ok(())
}

/*
 * ---------------------------------------------------------
 * APPLICATION DISCOVERY
 * ---------------------------------------------------------
 */

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApplicationCandidate {
    id: String,
    mac_app_names: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstalledApplication {
    id: String,
    installed: bool,
    path: Option<String>,
}

/*
 * Search for a matching .app bundle.
 *
 * We intentionally limit recursion depth so PrintVault
 * does not crawl huge sections of the filesystem.
 */
fn find_application(
    directory: &Path,
    candidate_names: &[String],
    depth_remaining: usize,
) -> Option<PathBuf> {
    if depth_remaining == 0 {
        return None;
    }

    let entries = fs::read_dir(directory).ok()?;

    for entry_result in entries {
        let entry = match entry_result {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        let path = entry.path();

        let file_name = entry.file_name().to_string_lossy().to_string();

        /*
         * If this is an application bundle,
         * compare its name.
         *
         * Do not recurse inside arbitrary .app bundles.
         */
        if file_name.to_lowercase().ends_with(".app") {
            let matches = candidate_names
                .iter()
                .any(|candidate| candidate.eq_ignore_ascii_case(&file_name));

            if matches {
                return Some(path);
            }

            continue;
        }

        /*
         * Normal directory:
         * recurse so nested installs such as
         *
         * /Applications/Maxon ZBrush 2026/ZBrush.app
         *
         * can be discovered.
         */
        if path.is_dir() {
            if let Some(found) = find_application(&path, candidate_names, depth_remaining - 1) {
                return Some(found);
            }
        }
    }

    None
}

#[tauri::command]
fn detect_installed_applications(
    app: tauri::AppHandle,
    candidates: Vec<ApplicationCandidate>,
) -> Result<Vec<InstalledApplication>, String> {
    let mut search_roots: Vec<PathBuf> = vec![PathBuf::from("/Applications")];

    /*
     * Also search the current user's
     * ~/Applications directory.
     *
     * This is important for applications such
     * as Autodesk Fusion that may be installed
     * per-user rather than system-wide.
     */
    if let Ok(home_dir) = app.path().home_dir() {
        search_roots.push(home_dir.join("Applications"));
    }

    let results = candidates
        .into_iter()
        .map(|candidate| {
            let mut found_path: Option<PathBuf> = None;

            for root in &search_roots {
                if !root.exists() {
                    continue;
                }

                if let Some(path) = find_application(root, &candidate.mac_app_names, 5) {
                    found_path = Some(path);

                    break;
                }
            }

            InstalledApplication {
                id: candidate.id,

                installed: found_path.is_some(),

                path: found_path.map(|path| path.to_string_lossy().to_string()),
            }
        })
        .collect();

    Ok(results)
}

/*
 * ---------------------------------------------------------
 * BACKUP & RECOVERY
 * ---------------------------------------------------------
 */

const DATABASE_FILE_NAME: &str = "3d-printvault.db";

const PENDING_RESTORE_DATABASE: &str = "3d-printvault.pending-restore.db";

const PENDING_RESTORE_PREFERENCES: &str = "3d-printvault.pending-restore-preferences.json";

const PENDING_RESTORE_MARKER: &str = "3d-printvault.pending-restore";

const PENDING_RESET_MARKER: &str = "3d-printvault.pending-reset";

const BACKUP_MANIFEST_NAME: &str = "manifest.txt";

const BACKUP_DATABASE_NAME: &str = "3d-printvault.db";

const BACKUP_PREFERENCES_NAME: &str = "preferences.json";

fn unix_millis() -> Result<u128, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .map_err(|error| format!("System time error: {error}"))
}

fn app_config_directory(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|error| format!("Failed to resolve application config directory: {error}"))
}

fn database_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_config_directory(app)?.join(DATABASE_FILE_NAME))
}

fn remove_file_if_present(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }

    fs::remove_file(path).map_err(|error| format!("Failed to remove {}: {error}", path.display(),))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BackupResult {
    path: String,
    created_at_unix_ms: u128,
    database_bytes: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApplicationDiagnosticInfo {
    version: String,
    product_name: String,
    os: String,
    arch: String,
    database_path: String,
    database_exists: bool,
    database_bytes: u64,
}

/*
 * Create a backup package directory.
 *
 * The package contains:
 *
 * manifest.txt
 * 3d-printvault.db
 * preferences.json
 *
 * Original STL / 3MF / OBJ / STEP files
 * are intentionally NOT copied.
 */
#[tauri::command]
fn create_application_backup(
    app: tauri::AppHandle,
    destination_directory: String,
    preferences_json: String,
) -> Result<BackupResult, String> {
    let database_path = database_file_path(&app)?;

    if !database_path.exists() {
        return Err("3D PrintVault database does not exist yet.".to_string());
    }

    let destination_root = PathBuf::from(destination_directory);

    fs::create_dir_all(&destination_root)
        .map_err(|error| format!("Failed to create backup destination: {error}"))?;

    let timestamp = unix_millis()?;

    let backup_directory = destination_root.join(format!("3D-PrintVault-Backup-{timestamp}"));

    fs::create_dir_all(&backup_directory)
        .map_err(|error| format!("Failed to create backup package: {error}"))?;

    let backup_database_path = backup_directory.join(BACKUP_DATABASE_NAME);

    fs::copy(&database_path, &backup_database_path)
        .map_err(|error| format!("Failed to copy database into backup: {error}"))?;

    let preferences_path = backup_directory.join(BACKUP_PREFERENCES_NAME);

    fs::write(&preferences_path, preferences_json)
        .map_err(|error| format!("Failed to save application preferences: {error}"))?;

    let manifest: String = format!(
        concat!(
            "format=1\n",
            "product=3D PrintVault\n",
            "created_unix_ms={timestamp}\n",
            "database={database}\n",
            "preferences={preferences}\n"
        ),
        timestamp = timestamp,
        database = BACKUP_DATABASE_NAME,
        preferences = BACKUP_PREFERENCES_NAME,
    );

    fs::write(backup_directory.join(BACKUP_MANIFEST_NAME), manifest)
        .map_err(|error| format!("Failed to save backup manifest: {error}"))?;

    let database_bytes = fs::metadata(&backup_database_path)
        .map_err(|error| format!("Failed to inspect backup database: {error}"))?
        .len();

    Ok(BackupResult {
        path: backup_directory.to_string_lossy().to_string(),

        created_at_unix_ms: timestamp,

        database_bytes,
    })
}

/*
 * Validate and stage a backup.
 *
 * The live database is NOT replaced here.
 * Replacement happens before the frontend
 * initializes on the next application start.
 */
#[tauri::command]
fn stage_application_restore(
    app: tauri::AppHandle,
    backup_directory: String,
) -> Result<(), String> {
    let backup_path = PathBuf::from(backup_directory);

    let manifest_path = backup_path.join(BACKUP_MANIFEST_NAME);

    let source_database = backup_path.join(BACKUP_DATABASE_NAME);

    if !manifest_path.exists() {
        return Err(
            "The selected folder is not a valid 3D PrintVault backup: manifest.txt is missing."
                .to_string(),
        );
    }

    if !source_database.exists() {
        return Err("The selected backup does not contain a 3D PrintVault database.".to_string());
    }

    let manifest = fs::read_to_string(&manifest_path)
        .map_err(|error| format!("Failed to read backup manifest: {error}"))?;

    if !manifest.contains("format=1") || !manifest.contains("product=3D PrintVault") {
        return Err("The selected backup uses an unsupported format.".to_string());
    }

    let config_directory = app_config_directory(&app)?;

    fs::create_dir_all(&config_directory)
        .map_err(|error| format!("Failed to prepare application config directory: {error}"))?;

    let staged_database = config_directory.join(PENDING_RESTORE_DATABASE);

    fs::copy(source_database, &staged_database)
        .map_err(|error| format!("Failed to stage backup database: {error}"))?;

    let source_preferences = backup_path.join(BACKUP_PREFERENCES_NAME);

    let staged_preferences = config_directory.join(PENDING_RESTORE_PREFERENCES);

    if source_preferences.exists() {
        fs::copy(source_preferences, staged_preferences)
            .map_err(|error| format!("Failed to stage backup preferences: {error}"))?;
    } else {
        fs::write(staged_preferences, "{}")
            .map_err(|error| format!("Failed to create empty restore preferences: {error}"))?;
    }

    fs::write(config_directory.join(PENDING_RESTORE_MARKER), "pending")
        .map_err(|error| format!("Failed to stage restore operation: {error}"))?;

    Ok(())
}

#[tauri::command]
fn consume_pending_restore_preferences(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let config_directory = app_config_directory(&app)?;

    let preferences_path = config_directory.join(PENDING_RESTORE_PREFERENCES);

    if !preferences_path.exists() {
        return Ok(None);
    }

    let contents = fs::read_to_string(&preferences_path)
        .map_err(|error| format!("Failed to read restored preferences: {error}"))?;

    remove_file_if_present(&preferences_path)?;

    Ok(Some(contents))
}

#[tauri::command]
fn stage_application_reset(app: tauri::AppHandle) -> Result<(), String> {
    let config_directory = app_config_directory(&app)?;

    fs::create_dir_all(&config_directory)
        .map_err(|error| format!("Failed to prepare application config directory: {error}"))?;

    fs::write(config_directory.join(PENDING_RESET_MARKER), "pending")
        .map_err(|error| format!("Failed to stage application reset: {error}"))?;

    Ok(())
}

#[tauri::command]
fn write_application_text_file(path: String, contents: String) -> Result<(), String> {
    let path = PathBuf::from(path);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create destination directory: {error}"))?;
    }

    fs::write(path, contents).map_err(|error| format!("Failed to write file: {error}"))
}

#[tauri::command]
fn get_application_diagnostic_info(
    app: tauri::AppHandle,
) -> Result<ApplicationDiagnosticInfo, String> {
    let database_path = database_file_path(&app)?;

    let database_exists = database_path.exists();

    let database_bytes = if database_exists {
        fs::metadata(&database_path)
            .map_err(|error| format!("Failed to inspect database: {error}"))?
            .len()
    } else {
        0
    };

    Ok(ApplicationDiagnosticInfo {
        version: app.package_info().version.to_string(),

        product_name: "3D PrintVault".to_string(),

        os: std::env::consts::OS.to_string(),

        arch: std::env::consts::ARCH.to_string(),

        database_path: database_path.to_string_lossy().to_string(),

        database_exists,

        database_bytes,
    })
}

/*
 * Apply a staged reset or restore before the
 * frontend opens its SQLite connection.
 */
fn apply_startup_recovery(app: &tauri::AppHandle) -> Result<(), String> {
    let config_directory = app_config_directory(app)?;

    fs::create_dir_all(&config_directory)
        .map_err(|error| format!("Failed to prepare application config directory: {error}"))?;

    let database_path = config_directory.join(DATABASE_FILE_NAME);

    let wal_path = config_directory.join(format!("{DATABASE_FILE_NAME}-wal"));

    let shm_path = config_directory.join(format!("{DATABASE_FILE_NAME}-shm"));

    /*
     * -----------------------------------------------------
     * RESET
     * -----------------------------------------------------
     */

    let reset_marker = config_directory.join(PENDING_RESET_MARKER);

    if reset_marker.exists() {
        remove_file_if_present(&database_path)?;

        remove_file_if_present(&wal_path)?;

        remove_file_if_present(&shm_path)?;

        remove_file_if_present(&reset_marker)?;

        remove_file_if_present(&config_directory.join(PENDING_RESTORE_DATABASE))?;

        remove_file_if_present(&config_directory.join(PENDING_RESTORE_PREFERENCES))?;

        remove_file_if_present(&config_directory.join(PENDING_RESTORE_MARKER))?;

        /*
         * Clear cached model thumbnails too.
         */

        if let Ok(cache_directory) = app.path().app_cache_dir() {
            let thumbnail_directory = cache_directory.join("model-thumbnails");

            if thumbnail_directory.exists() {
                let _ = fs::remove_dir_all(thumbnail_directory);
            }
        }

        return Ok(());
    }

    /*
     * -----------------------------------------------------
     * RESTORE
     * -----------------------------------------------------
     */

    let restore_marker = config_directory.join(PENDING_RESTORE_MARKER);

    if !restore_marker.exists() {
        return Ok(());
    }

    let staged_database = config_directory.join(PENDING_RESTORE_DATABASE);

    if !staged_database.exists() {
        return Err("A restore was staged but the staged database is missing.".to_string());
    }

    /*
     * Keep one emergency copy of the database
     * that existed immediately before restore.
     */

    if database_path.exists() {
        let safety_copy = config_directory.join("3d-printvault.pre-restore-safety.db");

        fs::copy(&database_path, safety_copy)
            .map_err(|error| format!("Failed to create pre-restore safety copy: {error}"))?;
    }

    remove_file_if_present(&wal_path)?;

    remove_file_if_present(&shm_path)?;

    remove_file_if_present(&database_path)?;

    fs::copy(&staged_database, &database_path)
        .map_err(|error| format!("Failed to restore database: {error}"))?;

    remove_file_if_present(&staged_database)?;

    remove_file_if_present(&restore_marker)?;

    Ok(())
}

/*
 * ---------------------------------------------------------
 * TAURI APPLICATION
 * ---------------------------------------------------------
 */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            apply_startup_recovery(&app.handle()).map_err(|error| {
                Box::<dyn std::error::Error>::from(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    error,
                ))
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            extract_3mf_thumbnail,
            save_model_thumbnail,
            open_in_application,
            detect_installed_applications,
            create_application_backup,
            stage_application_restore,
            consume_pending_restore_preferences,
            stage_application_reset,
            write_application_text_file,
            get_application_diagnostic_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
