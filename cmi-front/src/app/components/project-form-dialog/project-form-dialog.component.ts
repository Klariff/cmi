import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  standalone: false,
  selector: 'app-project-form-dialog',
  templateUrl: './project-form-dialog.component.html',
  styleUrls: ['./project-form-dialog.component.scss']
})
export class ProjectFormDialogComponent implements OnInit {
  action = "edit";
  name = "";
  introductionText = "";
  endingText = "";
  minOpenQuestionsCnt = 0;
  project: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public projectData: any,
    private readonly matDialogRef: MatDialogRef<ProjectFormDialogComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.projectData) {
      this.action = this.projectData.action;
      if (this.projectData.project) {
        this.name = this.projectData.project.name;
        this.minOpenQuestionsCnt = this.projectData.project.minOpenQuestionsCnt;
        this.introductionText = this.projectData.project.introductionText;
        this.endingText = this.projectData.project.endingText;
        this.project = this.projectData.project;
      }
    }
  }

  close() {
    this.matDialogRef.close();
  }

  copyAccessLink() {
    navigator.clipboard.writeText(window.location.origin + '/?projectId=' + this.project._id);
    this.toastr.success('Link copiado');
  }

  deleteResults() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminarán todos los resultados del proyecto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.httpClient.delete(`${environment.baseURL}clear/project?projectId=${this.project._id}`).subscribe({
          next: (data: any) => {
            this.toastr.success('Resultados eliminados');
          },
          error: (error) => {
            console.error(error)
          }
        });
      }
    })
  }

  submit() {
    if (this.minOpenQuestionsCnt < 1) {
      this.toastr.error('El número mínimo de clasificaciones libres debe ser mayor a 0', 'Error');
      return;
    }
    if (this.action === "edit") {
      if (this.name.trim() === "") {
        this.toastr.error('Complete el formulario', 'Error');
        return;
      }
      this.httpClient.patch(`${environment.baseURL}update/project?projectId=${this.project._id}`, { name: this.name, introductionText: this.introductionText, minOpenQuestionsCnt: this.minOpenQuestionsCnt, endingText: this.endingText }).subscribe({
        next: (data: any) => {
          Swal.fire({ title: 'Actualizando proyecto', allowOutsideClick: false, showConfirmButton: false });
          Swal.showLoading();
          setTimeout(() => {
            Swal.close();
            this.toastr.success('Proyecto actualizado');
            this.matDialogRef.close();
          }, 2000);

        }, error: (error) => {
          switch (error.status) {
            case 400:
              this.toastr.error("Complete el formulario", 'Error');
              break;
            case 406:
              this.toastr.error("Proyecto duplicado", 'Error');
              break;
            case 500:
              this.toastr.error("Error interno del servidor", 'Error');
              break;
          }
        }
      })
    } else {
      if (this.name.trim() === "") {
        this.toastr.error('Complete el formulario', 'Error');
        return;
      }
      this.httpClient.post(`${environment.baseURL}create/project`, { name: this.name, introductionText: this.introductionText, endingText: this.endingText, minOpenQuestionsCnt: this.minOpenQuestionsCnt, deleted: false, userId: sessionStorage.getItem('userId') }).subscribe({
        next: (data: any) => {
          this.toastr.success('Proyecto creado');
          this.matDialogRef.close();
        }, error: (error) => {
          switch (error.status) {
            case 400:
              this.toastr.error("Complete el formulario", 'Error');
              break;
            case 406:
              this.toastr.error("Proyecto duplicado", 'Error');
              break;
            case 500:
              this.toastr.error("Error interno del servidor", 'Error');
              break;
          }
        }
      })
    }
  }
}
