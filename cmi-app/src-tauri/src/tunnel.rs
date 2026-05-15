// Tunnel management — wraps the bundled cloudflared sidecar so the user can
// expose their local CMI server to the internet with one click.

use once_cell::sync::Lazy;
use regex::Regex;
use std::sync::Arc;
use tauri::AppHandle;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::sync::Mutex;
use tokio::time::{timeout, Duration};

#[derive(Default)]
pub struct TunnelState {
    inner: Arc<Mutex<TunnelInner>>,
}

#[derive(Default)]
struct TunnelInner {
    child: Option<CommandChild>,
    url: Option<String>,
}

// cloudflared prints the URL on stderr in lines like:
//   "INF |  https://random-words.trycloudflare.com         |"
static URL_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"https://[a-z0-9-]+\.trycloudflare\.com").expect("valid regex")
});

#[tauri::command]
pub async fn start_tunnel(
    app: AppHandle,
    state: tauri::State<'_, TunnelState>,
) -> Result<String, String> {
    let inner = state.inner.clone();

    // Already running? Return the existing URL.
    {
        let guard = inner.lock().await;
        if let Some(url) = &guard.url {
            return Ok(url.clone());
        }
    }

    let shell = app.shell();
    let sidecar = shell
        .sidecar("cloudflared")
        .map_err(|e| format!("No se pudo localizar cloudflared: {e}"))?;

    let (mut rx, child) = sidecar
        .args([
            "tunnel",
            "--no-autoupdate",
            "--url",
            "http://127.0.0.1:4000",
            "--metrics",
            "127.0.0.1:0",
        ])
        .spawn()
        .map_err(|e| format!("No se pudo iniciar cloudflared: {e}"))?;

    {
        let mut guard = inner.lock().await;
        guard.child = Some(child);
    }

    // Wait up to 30s for the URL to appear in the output.
    let inner_for_reader = inner.clone();
    let url_future = async move {
        while let Some(event) = rx.recv().await {
            let line = match event {
                CommandEvent::Stdout(bytes) | CommandEvent::Stderr(bytes) => {
                    String::from_utf8_lossy(&bytes).to_string()
                }
                CommandEvent::Terminated(_) => return Err("cloudflared terminó inesperadamente".to_string()),
                _ => continue,
            };
            if let Some(m) = URL_RE.find(&line) {
                let url = m.as_str().to_string();
                let mut guard = inner_for_reader.lock().await;
                guard.url = Some(url.clone());
                return Ok(url);
            }
        }
        Err("cloudflared cerró sin emitir una URL".to_string())
    };

    match timeout(Duration::from_secs(30), url_future).await {
        Ok(Ok(url)) => Ok(url),
        Ok(Err(e)) => {
            cleanup(&inner).await;
            Err(e)
        }
        Err(_) => {
            cleanup(&inner).await;
            Err("Timeout esperando la URL del túnel".to_string())
        }
    }
}

#[tauri::command]
pub async fn stop_tunnel(state: tauri::State<'_, TunnelState>) -> Result<(), String> {
    cleanup(&state.inner).await;
    Ok(())
}

#[tauri::command]
pub async fn tunnel_status(state: tauri::State<'_, TunnelState>) -> Result<Option<String>, String> {
    let guard = state.inner.lock().await;
    Ok(guard.url.clone())
}

async fn cleanup(inner: &Arc<Mutex<TunnelInner>>) {
    let mut guard = inner.lock().await;
    if let Some(child) = guard.child.take() {
        let _ = child.kill();
    }
    guard.url = None;
}
