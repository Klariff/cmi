import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-multiple-classifications-dialog',
  templateUrl: './multiple-classifications-dialog.component.html',
  styleUrls: ['./multiple-classifications-dialog.component.scss']
})
export class MultipleClassificationsDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public cardData: any,
    private readonly matDialogRef: MatDialogRef<MultipleClassificationsDialogComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  closeDialog(action: string) {
    this.matDialogRef.close({ action: action });
  }
}
