import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-classification-form-dialog',
  templateUrl: './classification-form-dialog.component.html',
  styleUrls: ['./classification-form-dialog.component.scss']
})
export class ClassificationFormDialogComponent {
  action = "edit";
  name = "";
  code = "";
  indication: string = "";
  closed = true;
  classification: any;
  categories: any[] = [];
  namedCategories: any[] = [];
  auxCategory: string = "";
  createdCategories: any[] = [];
  removedCategories: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public classificationData: any,
    private readonly matDialogRef: MatDialogRef<ClassificationFormDialogComponent>,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.classificationData) {
      this.action = this.classificationData.action;
      if (this.classificationData.classification) {
        this.name = this.classificationData.classification.name;
        this.code = this.classificationData.classification.code;
        this.indication = this.classificationData.classification.indication;
        this.classification = this.classificationData.classification;
        this.closed = this.classificationData.classification.closed;
        this.categories = this.classificationData.classification.categories;
        this.namedCategories = this.classificationData.classification.categories.map((category: any) => {
          return category.name;
        });
      }
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.namedCategories, event.previousIndex, event.currentIndex);
  }

  deleteCategory(categoryName: string) {
    this.namedCategories = this.namedCategories.filter((category: string) => {
      return category !== categoryName;
    });
    this.removedCategories.push(this.categories.find((category: any) => {
      return category.name === categoryName;
    }
    ));
  }

  createCategory() {
    if (this.auxCategory === "") {
      this.toastr.error('Complete el formulario', 'Error');
      return;
    } else if (this.namedCategories.find((category: string) => {
      return category === this.auxCategory;
    })) {
      this.toastr.error('Categoría duplicada', 'Error');
      return;
    } else if (this.auxCategory.trim() === "") {
      this.toastr.error('Complete el formulario', 'Error');
      return;
    }
    this.namedCategories.push(this.auxCategory);
    this.createdCategories.push(this.auxCategory);
    this.auxCategory = "";
  }

  close() {
    this.matDialogRef.close();
  }

  submit() {
    if (this.action === "edit") {
      if (this.namedCategories.length === 0) {
        this.toastr.error('Debe agregar al menos una categoría', 'Error');
        return;
      } else if (this.name === "" || this.code === "") {
        this.toastr.error('Complete el formulario', 'Error');
        return;
      } else if (this.name.trim() === "") {
        this.toastr.error('Complete el formulario', 'Error');
        return;
      }
      Swal.fire({ title: 'Actualizando clasificación', allowOutsideClick: false, showConfirmButton: false });
      Swal.showLoading();
      this.httpClient.patch(`${environment.baseURL}update/classification?classificationId=${this.classification._id}`, { name: this.name, code: this.code, indication: this.indication, closed: this.closed, static: true, projectId: sessionStorage.getItem('projectId') }).subscribe({
        next: (data: any) => {

          const deleteRequests = this.removedCategories.map(category =>
            this.httpClient.delete(`${environment.baseURL}delete/category?categoryId=${category._id}`)
          );

          let localCategories = this.namedCategories;

          localCategories = localCategories.map((category: any, index) => {
            return {
              name: category,
              classificationId: this.classification._id,
              closed: this.closed,
              projectId: sessionStorage.getItem('projectId'),
              code: index + 1,
              static: true,
              id: this.categories.find((cat: any) => {
                return cat.name === category;
              }) ? this.categories.find((cat: any) => {
                return cat.name === category;
              })._id : null
            }
          })

          let creationCategories = localCategories.filter((category: any) => {
            return this.categories.find((cat: any) => {
              return cat.name === category.name;
            }) === undefined;
          })

          let updateCategories = localCategories.filter((category: any) => {
            return this.categories.find((cat: any) => {
              return cat.name === category.name;
            }) !== undefined;
          })

          let updateRequest = updateCategories.map((category: any) => {
            return this.httpClient.patch(`${environment.baseURL}update/category?categoryId=${category.id}`, category)
          })

          let creationRequest = creationCategories.map((category: any) => {
            return this.httpClient.post(`${environment.baseURL}create/category`, category)
          })

          forkJoin([...deleteRequests, ...updateRequest, ...creationRequest]).subscribe({
            next: (response: any) => {
              Swal.close();
              this.toastr.success('Clasificación actualizada');
              setTimeout(() => {
                this.matDialogRef.close();
              }, 1000);
            }
          })
        }, error: (error) => {
          Swal.close();
          switch (error.status) {
            case 400:
              this.toastr.error("Complete el formulario", 'Error');
              break;
            case 406:
              this.toastr.error("Clasificación duplicada", 'Error');
              break;
            case 500:
              this.toastr.error("Error interno del servidor", 'Error');
              break;
          }
        }
      })
    } else {
      if (this.namedCategories.length === 0) {
        this.toastr.error('Debe agregar al menos una categoría', 'Error');
        return;
      } else if (this.name.trim() === "") {
        this.toastr.error('Complete el formulario', 'Error');
        return;
      }
      Swal.fire({ title: 'Creando clasificación', allowOutsideClick: false, showConfirmButton: false });
      Swal.showLoading();
      this.httpClient.post(`${environment.baseURL}create/classification`, { name: this.name, code: this.code, closed: this.closed, indication: this.indication, projectId: sessionStorage.getItem('projectId'), static: true }).subscribe({
        next: (data: any) => {
          let sendingCategories = this.namedCategories.map((category: any, index) => {
            return {
              name: category,
              classificationId: data.id,
              closed: this.closed,
              code: index + 1,
              static: true,
              projectId: sessionStorage.getItem('projectId')
            }
          })

          const createdCategories = sendingCategories.map(category =>
            this.httpClient.post(`${environment.baseURL}create/category`, category)
          );

          forkJoin(createdCategories).subscribe({
            next: (response: any) => {
              Swal.close();
              this.toastr.success('Clasificación creada');
              setTimeout(() => {
                this.matDialogRef.close();
              }, 1000);
            }
          })
        }, error: (error) => {
          Swal.close();
          switch (error.status) {
            case 400:
              this.toastr.error("Complete el formulario", 'Error');
              break;
            case 406:
              this.toastr.error("Clasificación duplicada", 'Error');
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
