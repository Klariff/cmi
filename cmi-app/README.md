# cmi-app — Tauri desktop shell

Single-binary desktop wrapper around the CMI backend (`../cmi-back`) and frontend (`../cmi-front`).

## One-time setup

System packages (Debian/Ubuntu — Tauri prerequisites):

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev \
  librsvg2-dev libsoup-3.0-dev
```

Toolchains:

- Node 18+ (recommended via nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install 20`)
- Rust stable (`curl -sSf https://sh.rustup.rs | sh -s -- -y`)
- Tauri CLI (`cargo install tauri-cli --version "^2" --locked`)

Backend dependencies (only needed once or after a `package.json` change):

```bash
cd ../cmi-back && npm install
cd ../cmi-front && npm install
```

## Run in development

From the project root (`cmi/`):

```bash
cd cmi-app && cargo tauri dev
```

This starts the Express backend (which serves both the API and the bundled frontend), waits for it on `http://127.0.0.1:4000`, and opens a desktop window pointing to it.

## Build a production binary

```bash
cd cmi-app && cargo tauri build
```

Outputs `.AppImage` / `.deb` (Linux), `.dmg` (macOS), `.msi` / `.exe` (Windows) under `src-tauri/target/release/bundle/`. The Node runtime is **not yet bundled** — that work lands in Phase 6 along with the GitHub Actions matrix.
