import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly matDialogRef: MatDialogRef<ImageViewerComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  closeDialog() {
    this.matDialogRef.close();
  }
}
