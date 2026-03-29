import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
@Component({
  selector: 'app-card-form-dialog',
  templateUrl: './card-form-dialog.component.html',
  styleUrls: ['./card-form-dialog.component.scss']
})
export class CardFormDialogComponent implements OnInit {
  action = "edit";
  name = "";
  code = "";
  imageSrc: string = "";
  file: any;
  card: any;
  onlyShowImage: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public cardData: any,
    private readonly matDialogRef: MatDialogRef<CardFormDialogComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.cardData) {
      this.action = this.cardData.action;
      if (this.cardData.card) {
        this.name = this.cardData.card.name;
        this.code = this.cardData.card.code;
        this.onlyShowImage = this.cardData.card.onlyShowImage;
        this.card = this.cardData.card;
        if (this.cardData.card.files[0]) {
          this.imageSrc = this.cardData.card.files[0];
        }
      }
    }
  }

  close() {
    this.matDialogRef.close();
  }

  deleteImage() {
    const index = this.card.files[0].lastIndexOf('=');
    let id = index !== -1 ? this.card.files[0].substring(index + 1) : null;
    this.httpClient.delete(`${environment.baseURL}delete/file?fileId=${id}&bucketName=card`).subscribe({
      next: (data: any) => {
        this.toastr.success('Imagen eliminada');
        this.imageSrc = "";
        this.matDialogRef.close({});
      }
    });
  }

  fileLoad(fileInputEvent: any) {
    if (fileInputEvent.target.files && fileInputEvent.target.files[0]) {
      const file = fileInputEvent.target.files[0];
      this.file = file;
      const reader = new FileReader();
      reader.onload = e => this.imageSrc = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  uploadImage() {
    return new Promise(async (resolve, reject) => {
      const formData = new FormData();
      let filename = this.cardData.card._id;
      filename = filename + '.' + this.file.name.split('.').pop();
      const options = {
        maxSizeMB: 2,
        useWebWorker: true,
      }
      let compressedFile = await imageCompression(this.file, options);
      formData.append('file', compressedFile, filename);
      let params = new HttpParams();
      params = params.append('bucketName', "card")
      this.httpClient.post(`${environment.baseURL}upload/file`, formData, { params: params }).subscribe({
        next: (data: any) => {
          resolve(data);
        }, error: (error) => {
          this.toastr.error("Error al subir la imagen", 'Error');
        }
      });
    });
  }

  submit() {
    if (this.action === "edit") {
      if (this.name.trim() === "") {
        this.toastr.error('Complete el formulario', 'Error');
        return;
      }
      this.httpClient.patch(`${environment.baseURL}update/card?cardId=${this.card._id}`, { name: this.name, code: this.code, onlyShowImage: this.onlyShowImage, projectId: sessionStorage.getItem('projectId'), static: true }).subscribe({
        next: async (data: any) => {
          Swal.fire({ title: 'Actualizando tarjeta', allowOutsideClick: false, showConfirmButton: false });
          Swal.showLoading();
          if (this.imageSrc) await this.uploadImage();
          setTimeout(() => {
            Swal.close();
            this.toastr.success('Tarjeta actualizada');
            this.matDialogRef.close();
          }, 2000);
        }, error: (error) => {
          switch (error.status) {
            case 400:
              this.toastr.error("Complete el formulario", 'Error');
              break;
            case 406:
              this.toastr.error("Tarjeta duplicada", 'Error');
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
      this.httpClient.post(`${environment.baseURL}create/card`, { name: this.name, code: this.code, deleted: false, projectId: sessionStorage.getItem('projectId'), static: true }).subscribe({
        next: async (data: any) => {
          Swal.fire({ title: 'Creando tarjeta', allowOutsideClick: false, showConfirmButton: false });
          Swal.showLoading();
          if (this.imageSrc) await this.uploadImage();
          setTimeout(() => {
            Swal.close();
            this.toastr.success('Tarjeta creada');
            this.matDialogRef.close();
          }, 2000);
        }, error: (error) => {
          switch (error.status) {
            case 400:
              this.toastr.error("Complete el formulario", 'Error');
              break;
            case 406:
              this.toastr.error("Tarjeta duplicada", 'Error');
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
