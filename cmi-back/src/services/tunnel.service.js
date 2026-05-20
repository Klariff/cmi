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
const fs = require('fs');
const path = require('path');

let child = null;
let url = null;
let keepAwake = null;

// Where we remember the cloudflared PID across launches, so a previous
// app session that was force-killed (SIGKILL doesn't run our exit
// handlers) can be cleaned up at startup.
function cloudflaredPidFile() {
    const dir = process.env.SQLITE_PATH ? path.dirname(process.env.SQLITE_PATH) : require('os').tmpdir();
    return path.join(dir, 'cloudflared.pid');
}

function killPid(pid) {
    if (!pid) return;
    try { process.kill(pid, 'SIGTERM'); } catch (_) {}
}

// On startup: if there's a leftover cloudflared from a previous crashed
// session, kill it so we don't accumulate orphans (which manifest as
// "Error 1033" for participants, since the tunnel URL is registered to
// a backend that no longer exists).
function reapStalePids() {
    try {
        const file = cloudflaredPidFile();
        if (!fs.existsSync(file)) return;
        const pid = parseInt(fs.readFileSync(file, 'utf8'), 10);
        if (Number.isFinite(pid)) {
            console.log(`[tunnel] reaping stale cloudflared pid ${pid}`);
            killPid(pid);
        }
        fs.unlinkSync(file);
    } catch (_) {}
}
reapStalePids();

// Prevent the host machine from sleeping while the public link is live.
// On macOS, `-w <pid>` makes caffeinate auto-exit when the parent dies,
// so we don't leave the display awake forever if Node was SIGKILL'd.
function startKeepAwake() {
    if (keepAwake) return;
    try {
        if (process.platform === 'darwin') {
            keepAwake = spawn('caffeinate', ['-di', '-w', String(process.pid)], { stdio: 'ignore' });
        } else if (process.platform === 'win32') {
            keepAwake = spawn('powershell.exe', [
                '-NoProfile', '-Command',
                "Add-Type -Name P -Namespace W -MemberDefinition '[DllImport(\"kernel32.dll\")] public static extern uint SetThreadExecutionState(uint esFlags);'; [W.P]::SetThreadExecutionState(0x80000003); while($true) { Start-Sleep -Seconds 60 }",
            ], { stdio: 'ignore' });
        } else {
            keepAwake = spawn('systemd-inhibit', ['--what=idle:sleep', '--why=CMI public link active', 'sleep', 'infinity'], { stdio: 'ignore' });
        }
        keepAwake.on('error', () => { keepAwake = null; });
        keepAwake.on('exit', () => { keepAwake = null; });
    } catch (_) {
        keepAwake = null;
    }
}

function stopKeepAwake() {
    if (keepAwake) {
        try { keepAwake.kill(); } catch (_) {}
        keepAwake = null;
    }
}

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

        startKeepAwake();

        const bin = process.env.CLOUDFLARED_PATH;
        const proc = spawn(bin, [
            'tunnel',
            '--no-autoupdate',
            '--url', 'http://127.0.0.1:4000',
            '--metrics', '127.0.0.1:0',
        ]);

        // Persist the pid so we can reap orphans on next launch.
        try { fs.writeFileSync(cloudflaredPidFile(), String(proc.pid)); } catch (_) {}

        const re = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
        let resolved = false;
        const timer = setTimeout(() => {
            if (!resolved) {
                try { proc.kill(); } catch (_) {}
                reject(new Error('Timeout esperando la URL del túnel'));
            }
        }, 30000);

        function onData(buf) {
            const text = buf.toString();
            // Forward to our own stderr so Tauri logs surface cloudflared chatter
            // (helps diagnose "Error 1033" / disconnect issues after the fact).
            process.stderr.write(`[cloudflared] ${text}`);
            if (resolved) return;
            const m = re.exec(text);
            if (m) {
                resolved = true;
                url = m[0];
                clearTimeout(timer);
                resolve(url);
            }
        }
        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);

        proc.on('exit', (code, signal) => {
            console.log(`[tunnel] cloudflared exited (code=${code}, signal=${signal})`);
            if (!resolved) {
                clearTimeout(timer);
                reject(new Error(`cloudflared terminó (code ${code})`));
            }
            child = null;
            url = null;
            try { fs.unlinkSync(cloudflaredPidFile()); } catch (_) {}
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
    stopKeepAwake();
    try { fs.unlinkSync(cloudflaredPidFile()); } catch (_) {}
}

// Make sure the cloudflared child dies when the backend does (graceful path).
process.on('exit', stop);
process.on('SIGTERM', () => { stop(); process.exit(0); });
process.on('SIGINT',  () => { stop(); process.exit(0); });

module.exports = { isAvailable, status, start, stop };
