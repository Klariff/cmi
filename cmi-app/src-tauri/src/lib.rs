#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            // Future: spawn the Node sidecar here in release builds.
            // In dev mode, `beforeDevCommand` already starts the backend.
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
