#[cfg(not(debug_assertions))]
mod backend;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            #[cfg(not(debug_assertions))]
            {
                if let Err(e) = backend::spawn(_app) {
                    eprintln!("[cmi] failed to start backend: {e}");
                }
            }
            Ok(())
        });

    builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, _event| {
            // On macOS Cmd+Q fires RunEvent::ExitRequested; on every platform
            // RunEvent::Exit fires right before the process leaves. Either
            // way we want the bundled Node sidecar gone.
            #[cfg(not(debug_assertions))]
            {
                if matches!(_event, tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit) {
                    backend::kill(_app_handle);
                }
            }
        });
}
