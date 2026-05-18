#!/usr/bin/env node
// Cross-platform replacement for the previous shell pipeline:
//   npm --prefix cmi-front run build && rm -rf cmi-back/public && cp -r cmi-front/dist/cmi-front cmi-back/public
//
// Invoked by Tauri's `beforeBuildCommand`. Works identically on Linux, macOS
// and Windows because everything is in Node — no shell quoting headaches.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root  = path.resolve(__dirname, '..', '..');
const front = path.join(root, 'cmi-front');
const back  = path.join(root, 'cmi-back');
const dest  = path.join(back, 'public');
const dist  = path.join(front, 'dist', 'cmi-front');

console.log('[build-frontend] Building Angular...');
execSync('npm run build', { stdio: 'inherit', cwd: front });

console.log(`[build-frontend] Copying ${dist} → ${dest}`);
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(dist, dest, { recursive: true });
console.log('[build-frontend] Done.');
