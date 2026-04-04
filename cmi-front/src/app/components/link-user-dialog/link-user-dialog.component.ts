import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
@Component({
  standalone: false,
  selector: 'app-link-user-dialog',
  templateUrl: './link-user-dialog.component.html',
  styleUrls: ['./link-user-dialog.component.scss']
})
export class LinkUserDialogComponent implements OnInit {
  username = "";
  action = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private readonly matDialogRef: MatDialogRef<LinkUserDialogComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.dialogData) {
      this.action = this.dialogData.action;
    }
  }

  close() {
    this.matDialogRef.close();
  }

  submit() {
    if (this.dialogData) {
      this.action = this.dialogData.action;
      if (this.action == 'link') {
        Swal.fire({
          title: '¿Estás seguro?',
          text: "Se concederá acceso al usuario",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Si',
          cancelButtonText: 'No'
        }).then((result) => {
          if (result.isConfirmed) {
            let projectId = window.sessionStorage.getItem('projectId');
            this.httpClient.post(`${environment.baseURL}link/user?username=${this.username}&projectId=${projectId}`, {}).subscribe({
              next: (data: any) => {
                this.toastr.success('Usuario vinculado');
                this.matDialogRef.close();
              },
              error: (error: any) => {
                console.error(error);
                this.toastr.error(error.error.message);
              }
            });
          }
        });
      } else {
        Swal.fire({
          title: '¿Estás seguro?',
          text: "El acceso del usuario a este proyecto será removido",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Si',
          cancelButtonText: 'No'
        }).then((result) => {
          if (result.isConfirmed) {
            let projectId = window.sessionStorage.getItem('projectId');
            this.httpClient.post(`${environment.baseURL}unlink/user?username=${this.username}&projectId=${projectId}`, {}).subscribe({
              next: (data: any) => {
                this.toastr.success('Usuario desvinculado');
                this.matDialogRef.close();
              },
              error: (error: any) => {
                console.error(error);
                this.toastr.error(error.error.message);
              }
            });
          }
        });
      }
    }
  }
}
