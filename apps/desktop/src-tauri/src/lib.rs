use std::fs;
use std::fs::File;
use std::io::Read;

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

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
                format!("Failed to read embedded thumbnail {candidate}: {error}")
            })?;

            return Ok(bytes);
        }
    }

    Err("No embedded 3MF thumbnail was found.".to_string())
}

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
            save_model_thumbnail
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
