import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  standalone: false,
  selector: 'app-password-form-dialog',
  templateUrl: './password-form-dialog.component.html',
  styleUrls: ['./password-form-dialog.component.scss']
})
export class PasswordFormDialogComponent implements OnInit {
  password1 = "";
  password2 = "";


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly matDialogRef: MatDialogRef<PasswordFormDialogComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
  }

  close() {
    this.matDialogRef.close();
  }

  submit() {
    if (this.password1 != this.password2) {
      this.toastr.warning('Las contraseñas no coinciden');
    }
    if (this.password1 == null || this.password2 == null || this.password1 == "" || this.password2 == "") {
      this.toastr.warning('Las contraseñas no pueden estar vacias');
      return;
    }
    if (this.password1.length < 8) {
      this.toastr.warning('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (this.password1.length > 20) {
      this.toastr.warning('La contraseña no puede tener más de 20 caracteres');
      return;
    }
    if (this.password1.match(/[A-Z]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos una letra mayúscula');
      return;
    }
    if (this.password1.match(/[a-z]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos una letra minúscula');
      return;
    }
    if (this.password1.match(/[0-9]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos un número');
      return;
    }
    if (this.password1.match(/[!@#\$%\^&\*\.]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos un caracter especial');
      return;
    }
    this.httpClient.patch(`${environment.baseURL}update/user?userId=${this.data.userId}`, { password: this.password1 }).subscribe({
      next: (response: any) => {
        this.toastr.success('Contraseña actualizada');
        this.matDialogRef.close();
      },
      error: (error: any) => {
        this.toastr.error('Error al actualizar la contraseña');
      },
    })

  }
}
