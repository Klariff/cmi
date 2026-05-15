mod tunnel;

#[cfg(not(debug_assertions))]
mod backend;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(tunnel::TunnelState::default())
        .invoke_handler(tauri::generate_handler![
            tunnel::start_tunnel,
            tunnel::stop_tunnel,
            tunnel::tunnel_status,
        ])
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
