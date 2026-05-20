// cloudflared "quick tunnel" wrapper. Replaces the Rust-side
// tauri-plugin-shell sidecar invocation: Express spawns cloudflared
// itself, parses the public URL out of stderr, and exposes the result
// via /api/tunnel/* endpoints.
//
// The bundled binary lives next to the Node sidecar in production
// (Tauri sets CLOUDFLARED_PATH when spawning the backend). In dev /
// SaaS mode the env var is unset and /api/tunnel/available returns 404
// so the UI can hide the feature.

const { spawn } = require('child_process');

let child = null;
let url = null;

function isAvailable() {
    return !!process.env.CLOUDFLARED_PATH;
}

function status() {
    return url;
}

function start() {
    return new Promise((resolve, reject) => {
        if (!isAvailable()) return reject(new Error('cloudflared no está disponible'));
        if (url) return resolve(url);

        const bin = process.env.CLOUDFLARED_PATH;
        const proc = spawn(bin, [
            'tunnel',
            '--no-autoupdate',
            '--url', 'http://127.0.0.1:4000',
            '--metrics', '127.0.0.1:0',
        ]);

        const re = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
        let resolved = false;
        const timer = setTimeout(() => {
            if (!resolved) {
                try { proc.kill(); } catch (_) {}
                reject(new Error('Timeout esperando la URL del túnel'));
            }
        }, 30000);

        function onData(buf) {
            if (resolved) return;
            const m = re.exec(buf.toString());
            if (m) {
                resolved = true;
                url = m[0];
                clearTimeout(timer);
                resolve(url);
            }
        }
        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);

        proc.on('exit', (code) => {
            if (!resolved) {
                clearTimeout(timer);
                reject(new Error(`cloudflared terminó (code ${code})`));
            }
            child = null;
            url = null;
        });

        child = proc;
    });
}

function stop() {
    if (child) {
        try { child.kill(); } catch (_) {}
        child = null;
    }
    url = null;
}

// Make sure the cloudflared child dies when the backend does.
process.on('exit', stop);
process.on('SIGTERM', () => { stop(); process.exit(0); });
process.on('SIGINT',  () => { stop(); process.exit(0); });

module.exports = { isAvailable, status, start, stop };
