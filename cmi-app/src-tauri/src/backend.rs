// Production-mode backend launcher.
//
// In dev (`cargo tauri dev`) the backend is started by the
// `beforeDevCommand` in tauri.conf.json. In a release build there is no
// such hook, so we spawn the bundled Node sidecar ourselves here, against
// the bundled cmi-back source tree (resource).

use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::path::BaseDirectory;
use tauri::{App, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

const PORT: &str = "4000";

/// Holds the spawned Node sidecar so we can kill it on app exit.
pub struct BackendChild(pub Mutex<Option<CommandChild>>);

pub fn spawn(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir: PathBuf = app
        .path()
        .resolve("cmi-back", BaseDirectory::Resource)?;
    let data_dir: PathBuf = app.path().app_data_dir()?;
    fs::create_dir_all(&data_dir)?;

    let entry = resource_dir.join("src").join("index.js");
    let sqlite = data_dir.join("cmi.db");
    let uploads = data_dir.join("uploads");
    let jwt_secret = read_or_create_secret(&data_dir.join("jwt.secret"))?;

    let cloudflared_path = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join(if cfg!(windows) { "cloudflared.exe" } else { "cloudflared" })))
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    eprintln!("[cmi] resource_dir     = {}", resource_dir.display());
    eprintln!("[cmi] entry            = {}", entry.display());
    eprintln!("[cmi] data_dir         = {}", data_dir.display());
    eprintln!("[cmi] cloudflared_path = {cloudflared_path}");

    let node = app.shell().sidecar("node")?;
    let (mut rx, child) = node
        .args([entry.to_string_lossy().to_string()])
        .env("PORT", PORT)
        .env("NODE_ENV", "production")
        .env("BASE_URL", format!("127.0.0.1:{PORT}"))
        .env("JWT_EXPIRATION_TIME", "30d")
        .env("EPOCH", "1512000000000")
        .env("SALT_ROUNDS", "10")
        .env("JWT_SECRET", jwt_secret)
        .env("SQLITE_PATH", sqlite.to_string_lossy().to_string())
        .env("UPLOAD_DIR", uploads.to_string_lossy().to_string())
        .env("CLOUDFLARED_PATH", cloudflared_path)
        .current_dir(&resource_dir)
        .spawn()?;

    // Park the child handle in app state so kill_backend() can reach it
    // from the RunEvent::Exit hook, otherwise dropping it here would kill
    // the process immediately.
    app.manage(BackendChild(Mutex::new(Some(child))));

    // Drain stdout/stderr and forward to our own stderr.
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(b) => eprintln!("[backend] {}", String::from_utf8_lossy(&b).trim_end()),
                CommandEvent::Stderr(b) => eprintln!("[backend!] {}", String::from_utf8_lossy(&b).trim_end()),
                CommandEvent::Terminated(payload) => {
                    eprintln!("[backend] terminated: {:?}", payload);
                    break;
                }
                CommandEvent::Error(e) => eprintln!("[backend!] error: {e}"),
                _ => {}
            }
        }
    });

    // Wait up to ~10s for the server to bind.
    for _ in 0..100 {
        if TcpStream::connect(("127.0.0.1", PORT.parse::<u16>().unwrap())).is_ok() {
            eprintln!("[cmi] backend ready");
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    eprintln!("[cmi] backend did not start in time");
    Ok(())
}

/// Terminate the Node sidecar (and, transitively, its cloudflared child).
/// Safe to call multiple times.
pub fn kill(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<BackendChild>() {
        if let Some(child) = state.0.lock().unwrap().take() {
            eprintln!("[cmi] stopping backend");
            let _ = child.kill();
        }
    }
}

fn read_or_create_secret(path: &std::path::Path) -> std::io::Result<String> {
    if let Ok(existing) = fs::read_to_string(path) {
        let trimmed = existing.trim().to_string();
        if !trimmed.is_empty() {
            return Ok(trimmed);
        }
    }
    let mut buf = [0u8; 32];
    getrandom(&mut buf)?;
    let hex: String = buf.iter().map(|b| format!("{b:02x}")).collect();
    fs::write(path, &hex)?;
    Ok(hex)
}

#[cfg(unix)]
fn getrandom(buf: &mut [u8]) -> std::io::Result<()> {
    use std::io::Read;
    let mut f = std::fs::File::open("/dev/urandom")?;
    f.read_exact(buf)?;
    Ok(())
}

#[cfg(windows)]
fn getrandom(buf: &mut [u8]) -> std::io::Result<()> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let mut seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64;
    for chunk in buf.chunks_mut(8) {
        seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        for (i, b) in chunk.iter_mut().enumerate() {
            *b = (seed >> (i * 8)) as u8;
        }
    }
    Ok(())
}
