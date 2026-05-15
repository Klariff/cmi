import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ShareLinkService } from 'src/app/services/share-link.service';

@Component({
  standalone: false,
  selector: 'app-share-link-dialog',
  templateUrl: './share-link-dialog.component.html',
  styleUrls: ['./share-link-dialog.component.scss']
})
export class ShareLinkDialogComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  url: string | null = null;
  participantUrl: string | null = null;

  constructor(
    private readonly dialogRef: MatDialogRef<ShareLinkDialogComponent>,
    private readonly shareLink: ShareLinkService,
    private readonly toastr: ToastrService,
  ) {}

  async ngOnInit() {
    try {
      const existing = await this.shareLink.getStatus();
      if (existing) {
        this.setUrl(existing);
        return;
      }
      const url = await this.shareLink.startTunnel();
      this.setUrl(url);
    } catch (e: any) {
      this.error = e?.message || String(e);
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    // Intentionally do not stop the tunnel here — closing the dialog should
    // not kill the link. The user must press "Detener enlace" explicitly.
  }

  private setUrl(url: string) {
    this.url = url;
    const projectId = sessionStorage.getItem('projectId');
    this.participantUrl = projectId ? `${url}/?projectId=${projectId}` : url;
  }

  copy(value: string) {
    navigator.clipboard.writeText(value);
    this.toastr.success('Copiado al portapapeles');
  }

  async stop() {
    try {
      await this.shareLink.stopTunnel();
      this.toastr.success('Enlace detenido');
      this.dialogRef.close();
    } catch (e: any) {
      this.toastr.error(e?.message || 'Error al detener el enlace', 'Error');
    }
  }

  close() {
    this.dialogRef.close();
  }
}
