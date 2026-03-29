import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ICard } from 'src/app/utils/interfaces/card.interface';
import { environment } from 'src/environments/environment';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { IClassification } from 'src/app/utils/interfaces/classification.interface';
import { IProject } from 'src/app/utils/interfaces/project.interface';
import { IUser } from 'src/app/utils/interfaces/user.interface';
import { CardFormDialogComponent } from 'src/app/components/card-form-dialog/card-form-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { PageEvent } from '@angular/material/paginator';
import { IParticipant } from 'src/app/utils/interfaces/participant.interface';
import { FileSaverService } from 'ngx-filesaver';
import Swal from 'sweetalert2';
import { ClassificationFormDialogComponent } from 'src/app/components/classification-form-dialog/classification-form-dialog.component';
import { forkJoin } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { ProjectFormDialogComponent } from 'src/app/components/project-form-dialog/project-form-dialog.component';
import { PasswordFormDialogComponent } from 'src/app/components/password-form-dialog/password-form-dialog.component';
import { LinkUserDialogComponent } from 'src/app/components/link-user-dialog/link-user-dialog.component';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  loggedIn: boolean = false;
  page: string = "";
  savedCards: ICard[] = [];
  savedClassifications: IClassification[] = [];
  savedParticipants: IParticipant[] = [];
  savedProjects: IProject[] = [];
  cardsColumns: string[] = ["code", "name", "action"];
  classificationsColumns: string[] = ["code", "name", "indication", "action"];
  projectsColumns: string[] = ["name", "minOpenQuestionsCnt", "introductionText", "action"];
  participantsColumns: string[] = ["fullName", "age", "gender", "socialClass", "educationalLevel", "surveyDate"];
  cardsDataSource!: MatTableDataSource<ICard>;
  participantsDataSource!: MatTableDataSource<IParticipant>;
  projectsDataSource!: MatTableDataSource<IProject>;
  project: any;
  pageEventCards: PageEvent = new PageEvent();
  lengthCards = 50;
  pageSizeCards = 10;
  pageIndexCards = 0;
  pageEventParticipants: PageEvent = new PageEvent();
  lengthParticipants = 50;
  pageSizeParticipants = 10;
  pageIndexParticipants = 0;
  pageEventClassifications: PageEvent = new PageEvent();
  classificationsDataSource!: MatTableDataSource<IClassification>;
  lengthClassifications = 50;
  pageSizeClassifications = 10;
  pageIndexClassifications = 0;
  pageEventProjects: PageEvent = new PageEvent();
  lengthProjects = 50;
  pageSizeProjects = 10;
  pageIndexProjects = 0;
  projectLoaded: boolean = false;
  selectedProject: any = null;
  user: any;
  newUser: any = {};

  constructor(
    private readonly dialog: MatDialog,
    private readonly httpClient: HttpClient,
    private toastr: ToastrService,
    private readonly fileSaverService: FileSaverService,
  ) { }

  ngOnInit(): void {
    if (sessionStorage.getItem("userId")) {
      this.loggedIn = true;
      this.httpClient.get(`${environment.baseURL}get/user?userId=${sessionStorage.getItem("userId")}`).subscribe({
        next: (user: any) => {
          if (!user) {
            sessionStorage.clear();
            location.href = '/login';
          }
          this.user = user;
          if (sessionStorage.getItem("projectId") != 'null') {
            this.selectedProject = sessionStorage.getItem("projectId");
          }
          if (sessionStorage.getItem("view") != 'null') {
            if (sessionStorage.getItem("view") != 'user') {
              this.page = sessionStorage.getItem("view")!;
            }
          }
          this.setPage(this.page);
        },
        error: (error) => {
          sessionStorage.clear();
          location.href = '/login';
        }
      });
    } else {
      sessionStorage.clear();
      location.href = '/login';
    }
  }

  setProject(projectId: string) {
    sessionStorage.setItem("projectId", projectId);
    this.setPage(this.page);
  }

  logout() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se cerrará la sesión actual",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.clear();
        location.href = '/login';
      }
    })
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
        this.httpClient.delete(`${environment.baseURL}clear/project?projectId=${this.selectedProject}`).subscribe({
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

  deleteProject(row?: IProject) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará toda la información del proyecto (Incluyendo clasificaciones, tarjetas, participantes y resultados)",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Eliminando proyecto",
          allowOutsideClick: false,
          showConfirmButton: false
        });
        Swal.showLoading();
        this.httpClient.delete(`${environment.baseURL}delete/project?projectId=${row ? row._id : this.selectedProject}`).subscribe({
          next: (data: any) => {
            setTimeout(() => {
              Swal.close();
              this.toastr.success('Proyecto eliminado');
              sessionStorage.clear();
              location.href = '/login';
            }, 4000)
          },
          error: (error) => {
            console.error(error)
          }
        });
      }
    })
  }

  formatDate(date: any) {
    date = new Date(date).toISOString();
    return date.split("T")[0].split("-").reverse().join("/");
  }

  createProject() {
    const dialogRef = this.dialog.open(ProjectFormDialogComponent, {
      width: '300px',
      data: { action: "create" }
    });
    dialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        window.location.reload();
      }, 1000)
    });
  }

  setPage(page: string) {
    document.getElementById("classifications-tab")?.classList.remove("sidenav-item-selected");
    document.getElementById("cards-tab")?.classList.remove("sidenav-item-selected");
    document.getElementById("participants-tab")?.classList.remove("sidenav-item-selected");
    document.getElementById("parameters-tab")?.classList.remove("sidenav-item-selected");
    document.getElementById("copy-access-link")?.classList.remove("sidenav-item-selected");
    document.getElementById("create-project-tab")?.classList.remove("sidenav-item-selected");
    document.getElementById("user-tab")?.classList.remove("sidenav-item-selected");
    document.getElementById("projects-tab")?.classList.remove("sidenav-item-selected");
    this.page = page;
    this.loadEntity(page);
  }

  linkUser() {
    const dialogRef = this.dialog.open(LinkUserDialogComponent, {
      width: '300px',
      data: { action: "link" }
    });
    dialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        window.location.reload();
      }, 1000)
    });
  }

  unlinkUser() {
    const dialogRef = this.dialog.open(LinkUserDialogComponent, {
      width: '300px',
      data: { action: "unlink" }
    });
    dialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        window.location.reload();
      }, 1000)
    });
  }

  unlinkMe() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará tu acceso a este proyecto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.httpClient.post(`${environment.baseURL}unlink/user?username=${this.user.username}&projectId=${this.selectedProject}`, {}).subscribe({
          next: (data: any) => {
            this.toastr.success('Usuario desvinculado');
            setTimeout(() => {
              sessionStorage.removeItem("projectId");
              this.setPage("");
              location.reload();
            }, 3000);
          },
          error: (error: any) => {
            console.error(error);
            this.toastr.error(error.error.message);
          }
        })
      }
    })
  }

  copyAccessLinkAdmin(row: any) {
    navigator.clipboard.writeText(environment.rootURL + '?projectId=' + row._id);
    this.toastr.success('Link copiado');
  }

  copyAccessLinkResearcher() {
    navigator.clipboard.writeText(environment.rootURL + '?projectId=' + sessionStorage.getItem("projectId"));
    this.toastr.success('Link copiado');
  }

  addCard() {
    const dialogRef = this.dialog.open(CardFormDialogComponent, {
      width: '300px',
      data: { action: "create" }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadEntity(this.page);
    });
  }

  addClassification() {
    const dialogRef = this.dialog.open(ClassificationFormDialogComponent, {
      width: '300px',
      data: { action: "create" }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadEntity(this.page);
    });
  }

  addProject() {
    const dialogRef = this.dialog.open(ProjectFormDialogComponent, {
      width: '300px',
      data: { action: "create" }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadEntity(this.page);
    });
  }

  editCard(card: ICard) {
    const dialogRef = this.dialog.open(CardFormDialogComponent, {
      width: '400px',
      data: { action: "edit", card: card }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadEntity(this.page);
    });
  }

  editClassification(classification: IClassification) {
    this.httpClient.get(`${environment.baseURL}get/category/classification?classificationId=${classification._id}`).subscribe({
      next: (data: any) => {
        classification.categories = data;
        const dialogRef = this.dialog.open(ClassificationFormDialogComponent, {
          width: '400px',
          data: { action: "edit", classification: classification }
        });
        dialogRef.afterClosed().subscribe(result => {
          this.loadEntity(this.page);
        });
      }
    })
  }


  updateUser() {
    let body: any = this.newUser;
    this.httpClient.patch(`${environment.baseURL}update/user?userId=${this.newUser._id}`, body).subscribe({
      next: (data: any) => {
        Swal.fire({ title: 'Actualizando usuario', allowOutsideClick: false, showConfirmButton: false });
        Swal.showLoading();
        setTimeout(() => {
          Swal.close();
          this.toastr.success('Usuario actualizado');
        }, 2000);
      }, error: (error) => {
        switch (error.status) {
          case 400:
            this.toastr.error("Complete el formulario", 'Error');
            break;
          case 406:
            this.toastr.error("Usuario duplicado", 'Error');
            break;
          case 500:
            this.toastr.error("Error interno del servidor", 'Error');
            break;
        }
      }
    })
  }

  changePassword() {
    const dialogRef = this.dialog.open(PasswordFormDialogComponent, {
      width: '300px',
      data: { userId: this.user._id },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadEntity(this.page);
    });
  }

  deleteCard(card: ICard) {
    Swal.fire({
      title: '¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.httpClient.delete(`${environment.baseURL}delete/card?cardId=${card._id}`).subscribe({
          next: (data: any) => {
            this.toastr.success('Tarjeta eliminada');
            setTimeout(() => {
              location.reload();
            }, 1000);
          },
          error: (error) => {
            console.error(error)
          }
        });
      }
    })
  }

  deleteUser() {
    let user = this.user;
    Swal.fire({
      title: '¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.httpClient.delete(`${environment.baseURL}delete/user?userId=${user._id}`).subscribe({
          next: (data: any) => {
            this.toastr.success('Usuario eliminado');
            setTimeout(() => {
              sessionStorage.clear();
              location.href = '/login'
            }, 1000);
          },
          error: (error) => {
            console.error(error)
          }
        });
      }
    })
  }

  deleteClassification(classification: IClassification) {
    Swal.fire({
      title: '¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.httpClient.delete(`${environment.baseURL}delete/classification?classificationId=${classification._id}`).subscribe({
          next: (data: any) => {
            this.httpClient.get(`${environment.baseURL}get/category/classification?classificationId=${classification._id}`).subscribe({
              next: (categories: any) => {
                const requests = categories.map((category: any) =>
                  this.httpClient.delete(`${environment.baseURL}delete/category?categoryId=${category._id}`)
                );
                forkJoin(requests).subscribe({
                  next: (response: any) => {
                    this.toastr.success('Clasificación eliminada');
                    setTimeout(() => {
                      location.reload();
                    }, 1000);
                  }
                })
              }
            })
          },
          error: (error) => {
            console.error(error)
          }
        });
      }
    })
  }

  clearPreviousEntity() {
    this.classificationsDataSource = new MatTableDataSource();
    this.cardsDataSource = new MatTableDataSource();
    this.participantsDataSource = new MatTableDataSource();
    this.projectLoaded = false;
  }

  checkUserAccess(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.httpClient.get(`${environment.baseURL}get/user?userId=${sessionStorage.getItem("userId")}`).subscribe({
        next: (user: any) => {
          if (user.projects.find((project: any) => project._id == this.selectedProject)) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: (error) => {
          console.error(error);
          reject(false);
        }
      });
    });
  }

  loadEntity(entity: string) {
    const timeout = 100;
    if (this.selectedProject) {
      this.checkUserAccess().then(access => {
        if (access || entity == 'user') { 
          switch (entity) {
            case "classifications":
              sessionStorage.setItem("view", "classifications");
              this.clearPreviousEntity()
              setTimeout(() => document.getElementById("classifications-tab")?.classList.add("sidenav-item-selected"), 100)
              this.httpClient.get(`${environment.baseURL}get/classifications/default?limit=${this.pageSizeClassifications}&page=${this.pageIndexClassifications + 1}&projectId=${this.selectedProject}`).subscribe((response: any) => {
                this.savedClassifications = response.classifications;
                this.lengthClassifications = response.count;
                this.classificationsDataSource = new MatTableDataSource(this.savedClassifications);
              });
              break;
            case "cards":
              sessionStorage.setItem("view", "cards");
              this.clearPreviousEntity()
              setTimeout(() => document.getElementById("cards-tab")?.classList.add("sidenav-item-selected"), 100)
              this.httpClient.get(`${environment.baseURL}get/cards?limit=${this.pageSizeCards}&page=${this.pageIndexCards + 1}&projectId=${this.selectedProject}`).subscribe((response: any) => {
                this.savedCards = response.cards;
                this.lengthCards = response.count;
                this.cardsDataSource = new MatTableDataSource(this.savedCards);
              });
              break;
            case "participants":
              sessionStorage.setItem("view", "participants");
              this.clearPreviousEntity()
              setTimeout(() => document.getElementById("participants-tab")?.classList.add("sidenav-item-selected"), 100)
              this.httpClient.get(`${environment.baseURL}get/participants?limit=${this.pageSizeParticipants}&page=${this.pageIndexParticipants + 1}&projectId=${this.selectedProject}`).subscribe((response: any) => {
                this.savedParticipants = response.participants;
                this.lengthParticipants = response.count;
                this.participantsDataSource = new MatTableDataSource(this.savedParticipants);
              });
              break;
            case "parameters":
              sessionStorage.setItem("view", "parameters");
              this.clearPreviousEntity()
              setTimeout(() => document.getElementById("parameters-tab")?.classList.add("sidenav-item-selected"), 100)
              this.httpClient.get(`${environment.baseURL}get/project?projectId=${this.selectedProject}`).subscribe((response: any) => {
                this.project = response;
                this.projectLoaded = true;
              });
              break;
            case "user":
              sessionStorage.setItem("view", "user");
              this.clearPreviousEntity()
              setTimeout(() => document.getElementById("user-tab")?.classList.add("sidenav-item-selected"), 100)
              this.httpClient.get(`${environment.baseURL}get/user?userId=${sessionStorage.getItem("userId")}`).subscribe((response: any) => {
                this.newUser.deleted = response.deleted;
                this.newUser.fullName = response.fullName;
                this.newUser.username = response.username;
                this.newUser._id = response._id;
              });
              break;
            default:
              this.page = 'classifications'
              sessionStorage.setItem("view", "classifications");
              this.clearPreviousEntity()
              setTimeout(() => document.getElementById("classifications-tab")?.classList.add("sidenav-item-selected"), 100)
              this.httpClient.get(`${environment.baseURL}get/classifications/default?limit=${this.pageSizeClassifications}&page=${this.pageIndexClassifications + 1}&projectId=${this.selectedProject}`).subscribe((response: any) => {
                this.savedClassifications = response.classifications;
                this.lengthClassifications = response.count;
                this.classificationsDataSource = new MatTableDataSource(this.savedClassifications);
              });
              break;
          }
        } else {
          Swal.fire({
            title: 'Acceso denegado',
            text: 'No tienes acceso a este proyecto',
            icon: 'error',
            showConfirmButton: false,
            timer: 2000
          });
          setTimeout(() => {
            sessionStorage.removeItem("projectId");
            location.href = '/login';
          }, 2000);
        }
      })
    } else {
      if (entity == "user") {
        sessionStorage.setItem("view", "user");
        this.clearPreviousEntity()
        setTimeout(() => document.getElementById("user-tab")?.classList.add("sidenav-item-selected"), 100)
        this.httpClient.get(`${environment.baseURL}get/user?userId=${sessionStorage.getItem("userId")}`).subscribe((response: any) => {
          this.newUser.deleted = response.deleted;
          this.newUser.fullName = response.fullName;
          this.newUser.username = response.username;
          this.newUser._id = response._id;
        });
      }
    }
  }

  downloadCSV() {
    Swal.fire({ title: 'Descargando resultados', allowOutsideClick: false, showConfirmButton: false });
    Swal.showLoading();
    this.httpClient.get(`${environment.baseURL}download/results?projectId=${sessionStorage.getItem('projectId')}`, { responseType: "blob" }).subscribe((response: any) => {
      this.fileSaverService.save(response, `CMI-Resultados-${this.formatDate(new Date())}.csv`);
      Swal.close();
    })
  }

  downloadLabeledCSV() {
    Swal.fire({ title: 'Descargando resultados', allowOutsideClick: false, showConfirmButton: false });
    Swal.showLoading();
    this.httpClient.get(`${environment.baseURL}download/labeled-results?projectId=${sessionStorage.getItem('projectId')}`, { responseType: "blob" }).subscribe((response: any) => {
      this.fileSaverService.save(response, `CMI-Resultados-Etiquetados-${this.formatDate(new Date())}.csv`);
      Swal.close();
    })
  }

  downloadParticipants() {
    Swal.fire({ title: 'Descargando participantes', allowOutsideClick: false, showConfirmButton: false });
    Swal.showLoading();
    this.httpClient.get(`${environment.baseURL}download/participants?projectId=${sessionStorage.getItem('projectId')}`, { responseType: "blob" }).subscribe((response: any) => {
      this.fileSaverService.save(response, `CMI-Participantes-${this.formatDate(new Date())}.xlsx`);
      Swal.close();
    })
  }

  handlePageEventClassifications(e: PageEvent) {
    this.pageEventClassifications = e;
    this.lengthClassifications = e.length;
    this.pageSizeClassifications = e.pageSize;
    this.pageIndexClassifications = e.pageIndex;
    this.loadEntity(this.page);
  }


  handlePageEventCards(e: PageEvent) {
    this.pageEventCards = e;
    this.lengthCards = e.length;
    this.pageSizeCards = e.pageSize;
    this.pageIndexCards = e.pageIndex;
    this.loadEntity(this.page);
  }

  handlePageEventParticipants(e: PageEvent) {
    this.pageEventParticipants = e;
    this.lengthParticipants = e.length;
    this.pageSizeParticipants = e.pageSize;
    this.pageIndexParticipants = e.pageIndex;
    this.loadEntity(this.page);
  }

  handlePageEventProjects(e: PageEvent) {
    this.pageEventProjects = e;
    this.lengthProjects = e.length;
    this.pageSizeProjects = e.pageSize;
    this.pageIndexProjects = e.pageIndex;
    this.loadEntity(this.page);
  }

  trimIntroductionText(text: string) {
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  updateParameters() {
    for (const attribute in this.project) {
      if (this.project[attribute] == null || this.project[attribute] == undefined || this.project[attribute] === "" || this.project[attribute].trim() === "") {
        this.toastr.error("Complete el formulario", 'Error');
        return;
      }
    }

    if (this.project.minOpenQuestionsCnt < 1) {
      this.toastr.error("El número mínimo de clasificaciones libres debe ser mayor a 0", 'Error');
      return;
    }
    Swal.fire({ title: "Cargando...", allowOutsideClick: false, showConfirmButton: false });
    Swal.showLoading();
    this.httpClient.patch(`${environment.baseURL}update/project?projectId=${this.project._id}`, { minOpenQuestionsCnt: this.project.minOpenQuestionsCnt, introductionText: this.project.introductionText, endingText: this.project.endingText, name: this.project.name }).subscribe({
      next: (data: any) => {
        this.toastr.success('Parámetros actualizados');
        Swal.close();
      },
      error: (error) => {
        Swal.close();
        switch (error.status) {
          case 400:
            this.toastr.error("Complete el formulario", 'Error');
            break;
          case 406:
            this.toastr.error("Parámetro duplicado", 'Error');
            break;
          case 500:
            this.toastr.error("Error interno del servidor", 'Error');
            break;
        }
      }
    });

  }

}
