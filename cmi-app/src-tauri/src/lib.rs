mod tunnel;

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
