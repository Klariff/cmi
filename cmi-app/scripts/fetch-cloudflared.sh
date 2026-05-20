#!/usr/bin/env bash
# Downloads the cloudflared binary for the current platform and places it
# under cmi-app/src-tauri/binaries/cloudflared-<rust-target-triple> so Tauri
# can ship it as a sidecar.
#
# Re-run this whenever you need to update the bundled cloudflared, or when
# building on a fresh machine.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p src-tauri/binaries

# Tauri sidecars are named after the target triple, not the host. Honour
# $TARGET in CI so a cross-compile build (x86_64 from arm64 macOS) gets
# the right cloudflared binary.
TRIPLE="${TARGET:-$(rustc -vV | sed -n 's/host: //p')}"
OUT="src-tauri/binaries/cloudflared-${TRIPLE}"

case "$TRIPLE" in
    x86_64-unknown-linux-gnu)
        URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
        ;;
    aarch64-unknown-linux-gnu)
        URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
        ;;
    x86_64-apple-darwin|aarch64-apple-darwin)
        ARCH=amd64
        [[ "$TRIPLE" == aarch64-* ]] && ARCH=arm64
        TMP="$(mktemp -d)"
        curl -fL -o "$TMP/cf.tgz" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-${ARCH}.tgz"
        tar -xzf "$TMP/cf.tgz" -C "$TMP"
        mv "$TMP/cloudflared" "$OUT"
        chmod +x "$OUT"
        rm -rf "$TMP"
        echo "Wrote $OUT"
        exit 0
        ;;
    x86_64-pc-windows-msvc)
        OUT="${OUT}.exe"
        URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        ;;
    *)
        echo "Unsupported target triple: $TRIPLE" >&2
        exit 1
        ;;
esac

echo "Downloading cloudflared for $TRIPLE..."
curl -fL --progress-bar -o "$OUT" "$URL"
chmod +x "$OUT"
echo "Wrote $OUT"
