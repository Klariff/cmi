import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Public-link manager. The backend exposes /api/tunnel/* endpoints only
 * when running inside the desktop app (Tauri sets CLOUDFLARED_PATH for
 * the bundled Node sidecar). In dev / SaaS mode the endpoints 404 and
 * isAvailable() resolves to false, so the UI hides the share button.
 */
@Injectable({ providedIn: 'root' })
export class ShareLinkService {
  private cachedAvailable: boolean | null = null;

  constructor(private readonly http: HttpClient) { }

  async isAvailable(): Promise<boolean> {
    if (this.cachedAvailable !== null) return this.cachedAvailable;
    try {
      await firstValueFrom(this.http.get(`${environment.baseURL}tunnel/available`));
      this.cachedAvailable = true;
    } catch {
      this.cachedAvailable = false;
    }
    return this.cachedAvailable;
  }

  async startTunnel(): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ url: string }>(`${environment.baseURL}tunnel/start`, {})
    );
    return res.url;
  }

  async stopTunnel(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.baseURL}tunnel/stop`, {}));
  }

  async getStatus(): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ url: string | null }>(`${environment.baseURL}tunnel/status`)
      );
      return res.url;
    } catch {
      return null;
    }
  }
}
