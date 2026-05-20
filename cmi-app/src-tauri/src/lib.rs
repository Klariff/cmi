#[cfg(not(debug_assertions))]
mod backend;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            #[cfg(not(debug_assertions))]
            {
                if let Err(e) = backend::spawn(_app) {
                    eprintln!("[cmi] failed to start backend: {e}");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
