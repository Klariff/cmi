#!/usr/bin/env bash
# Downloads a Node.js binary for the current platform and places it under
# cmi-app/src-tauri/binaries/node-<rust-target-triple> so Tauri can ship it
# as a sidecar.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p src-tauri/binaries

NODE_VERSION="${NODE_VERSION:-v20.20.2}"
# Honour TARGET env var so CI can cross-compile (build x86_64 sidecar on
# an arm64 host, etc); fall back to the host triple for local dev.
TRIPLE="${TARGET:-$(rustc -vV | sed -n 's/host: //p')}"

case "$TRIPLE" in
    x86_64-unknown-linux-gnu)
        ARCHIVE="node-${NODE_VERSION}-linux-x64.tar.xz"
        OUT="src-tauri/binaries/node-${TRIPLE}"
        ;;
    aarch64-unknown-linux-gnu)
        ARCHIVE="node-${NODE_VERSION}-linux-arm64.tar.xz"
        OUT="src-tauri/binaries/node-${TRIPLE}"
        ;;
    x86_64-apple-darwin)
        ARCHIVE="node-${NODE_VERSION}-darwin-x64.tar.gz"
        OUT="src-tauri/binaries/node-${TRIPLE}"
        ;;
    aarch64-apple-darwin)
        ARCHIVE="node-${NODE_VERSION}-darwin-arm64.tar.gz"
        OUT="src-tauri/binaries/node-${TRIPLE}"
        ;;
    x86_64-pc-windows-msvc)
        ARCHIVE="node-${NODE_VERSION}-win-x64.zip"
        OUT="src-tauri/binaries/node-${TRIPLE}.exe"
        ;;
    *)
        echo "Unsupported target triple: $TRIPLE" >&2
        exit 1
        ;;
esac

URL="https://nodejs.org/dist/${NODE_VERSION}/${ARCHIVE}"
TMP="$(mktemp -d)"
echo "Downloading $URL"
curl -fL --progress-bar -o "$TMP/$ARCHIVE" "$URL"

case "$ARCHIVE" in
    *.tar.xz) tar -xJf "$TMP/$ARCHIVE" -C "$TMP" ;;
    *.tar.gz) tar -xzf "$TMP/$ARCHIVE" -C "$TMP" ;;
    *.zip)    unzip -q "$TMP/$ARCHIVE" -d "$TMP" ;;
esac

# Find the extracted node binary and move it into place.
if [[ "$ARCHIVE" == *.zip ]]; then
    SRC="$(find "$TMP" -name 'node.exe' | head -1)"
else
    SRC="$(find "$TMP" -path '*/bin/node' | head -1)"
fi

if [[ -z "$SRC" ]]; then
    echo "Could not find the extracted node binary" >&2
    exit 1
fi

mv "$SRC" "$OUT"
chmod +x "$OUT"
rm -rf "$TMP"
echo "Wrote $OUT"
