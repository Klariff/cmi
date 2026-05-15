import { Injectable } from '@angular/core';

// Tauri 2 exposes `__TAURI_INTERNALS__.invoke` on window when the app is
// running inside the desktop shell. In a regular browser this returns false
// and all share-link UI stays hidden.
function tauriInvoke(): ((cmd: string, args?: any) => Promise<any>) | null {
  const w = window as any;
  if (w.__TAURI_INTERNALS__ && typeof w.__TAURI_INTERNALS__.invoke === 'function') {
    return (cmd: string, args?: any) => w.__TAURI_INTERNALS__.invoke(cmd, args);
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class ShareLinkService {
  isAvailable(): boolean {
    return tauriInvoke() !== null;
  }

  async startTunnel(): Promise<string> {
    const invoke = tauriInvoke();
    if (!invoke) throw new Error('Tauri no disponible');
    return await invoke('start_tunnel');
  }

  async stopTunnel(): Promise<void> {
    const invoke = tauriInvoke();
    if (!invoke) return;
    await invoke('stop_tunnel');
  }

  async getStatus(): Promise<string | null> {
    const invoke = tauriInvoke();
    if (!invoke) return null;
    return await invoke('tunnel_status');
  }
}
