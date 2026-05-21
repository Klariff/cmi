import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
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
  private readonly urlSubject = new BehaviorSubject<string | null>(null);

  /** Reactive current tunnel URL, or null if not running. */
  readonly url$: Observable<string | null> = this.urlSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    // Poll status every 10s so the indicator updates even if the tunnel
    // is started/stopped from a different tab or dies on its own.
    setInterval(() => this.refreshStatus(), 10000);
  }

  async isAvailable(): Promise<boolean> {
    if (this.cachedAvailable !== null) return this.cachedAvailable;
    try {
      await firstValueFrom(this.http.get(`${environment.baseURL}tunnel/available`));
      this.cachedAvailable = true;
      // Kick off an initial status fetch once we know the endpoint exists.
      this.refreshStatus();
    } catch {
      this.cachedAvailable = false;
    }
    return this.cachedAvailable;
  }

  async startTunnel(): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ url: string }>(`${environment.baseURL}tunnel/start`, {})
    );
    this.urlSubject.next(res.url);
    return res.url;
  }

  async stopTunnel(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.baseURL}tunnel/stop`, {}));
    this.urlSubject.next(null);
  }

  async getStatus(): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ url: string | null }>(`${environment.baseURL}tunnel/status`)
      );
      this.urlSubject.next(res.url);
      return res.url;
    } catch {
      return null;
    }
  }

  private async refreshStatus() {
    if (!this.cachedAvailable) return;
    await this.getStatus();
  }
}
