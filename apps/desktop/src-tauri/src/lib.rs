use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
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
        .invoke_handler(tauri::generate_handler![
            greet,
            extract_3mf_thumbnail,
            save_model_thumbnail,
            open_in_application,
            detect_installed_applications
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
