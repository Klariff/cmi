// Production-mode backend launcher.
//
// In dev (`cargo tauri dev`) the backend is started by the
// `beforeDevCommand` in tauri.conf.json. In a release build there is no
// such hook, so we spawn the bundled Node sidecar ourselves here, against
// the bundled cmi-back source tree (resource).

use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::time::Duration;
use tauri::path::BaseDirectory;
use tauri::{App, Manager};
use tauri_plugin_shell::ShellExt;

const PORT: &str = "4000";

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

    let node = app.shell().sidecar("node")?;
    let (_rx, _child) = node
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
        .current_dir(&resource_dir)
        .spawn()?;

    // Wait up to ~5s for the server to bind. If it doesn't come up the
    // webview will just show a connection error, which we let surface so
    // the user knows something is broken (rather than hanging silently).
    for _ in 0..50 {
        if TcpStream::connect(("127.0.0.1", PORT.parse::<u16>().unwrap())).is_ok() {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    Ok(())
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
    // Sufficient entropy for a per-installation JWT secret; not crypto-grade
    // randomness, but the secret never leaves the user's machine in cleartext.
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
