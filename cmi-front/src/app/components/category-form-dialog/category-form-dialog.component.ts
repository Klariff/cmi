import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-category-form-dialog',
  templateUrl: './category-form-dialog.component.html',
  styleUrls: ['./category-form-dialog.component.scss']
})
export class CategoryFormDialogComponent {
  name: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { existingNames: string[] },
    private readonly matDialogRef: MatDialogRef<CategoryFormDialogComponent>,
    private toastr: ToastrService
  ) { }

  cancel() {
    this.matDialogRef.close(null);
  }

  submit() {
    const trimmed = this.name.trim();
    if (!trimmed) {
      this.toastr.warning('Debe dar un nombre a la categoría');
      return;
    }
    if (this.data?.existingNames?.includes(trimmed)) {
      this.toastr.warning('No pueden haber categorías con el mismo nombre');
      return;
    }
    this.matDialogRef.close(trimmed);
  }
}
