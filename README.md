# CMI

Native desktop application for running CMI (Constructs Mental Image) classification studies.
The researcher launches the app, configures their project, and shares a one-click public
link with participants — no cloud, no server, no technical setup.

## Architecture

This branch (`tauri-native-app`) ships a single double-clickable installer that bundles:

- **Express backend** (`cmi-back/`) — HTTP API persisting to a local SQLite database, with
  uploaded videos and images written to the user's app-data directory.
- **Angular frontend** (`cmi-front/`) — built and served by Express as static files.
- **Tauri shell** (`cmi-app/`) — a thin Rust/webview wrapper that opens a window pointing at
  the locally-running Express server. In a release build it spawns a bundled Node sidecar to
  start the backend; in dev mode it relies on `cargo tauri dev`'s `beforeDevCommand`.
- **cloudflared sidecar** — bundled binary the user can launch from the admin UI to expose
  the local server at a `*.trycloudflare.com` URL so participants can connect.

```
┌────────────────────────────────────────────────┐
│  Tauri window (webview)                        │
│  ↓ http://127.0.0.1:4000                       │
│  Express ─── SQLite + uploads in app-data dir  │
│         └── (optional) cloudflared tunnel      │
└────────────────────────────────────────────────┘
```

## Local development

See `cmi-app/README.md` for one-time setup. Quick start:

```bash
# in cmi-back/ and cmi-front/, run npm install once
cd cmi-app
./scripts/fetch-cloudflared.sh   # downloads sidecar
./scripts/fetch-node.sh          # downloads Node sidecar (only needed for `cargo tauri build`)
cargo tauri dev
```

## Building installers

Tagged commits trigger `.github/workflows/release.yml`, which builds for macOS (Intel + ARM),
Windows x64, and Linux x64, and uploads `.dmg`, `.msi`, `.AppImage` and `.deb` artifacts to a
draft GitHub release.

```bash
git tag v0.1.0
git push origin v0.1.0
```
