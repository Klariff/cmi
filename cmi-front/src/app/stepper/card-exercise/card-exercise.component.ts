import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgFor } from '@angular/common';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ICategory } from '../../utils/interfaces/category.interface'
import { ICard } from '../../utils/interfaces/card.interface'
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IClassification } from '../../utils/interfaces/classification.interface';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { concat, finalize, of, forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MultipleClassificationsDialogComponent } from 'src/app/components/multiple-classifications-dialog/multiple-classifications-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { ImageViewerComponent } from 'src/app/components/image-viewer/image-viewer.component';
@Component({
  standalone: false,
  selector: 'card-exercise-component',
  templateUrl: './card-exercise.component.html',
  styleUrls: ['./card-exercise.component.scss']
})
export class CardExerciseComponent implements OnInit {
  @Input() userBody: any;
  classificationBodies: any[] = [];
  categoriesBodies: any[] = [];
  savedCards: ICard[] = [];
  namedCards: string[] = [];
  categories: ICategory[] = [];
  categoryCtn = 1;
  minOpenQuestionsCnt: number = 0;
  classificationStageLabel: number = 1.1;
  stageIndex: number = 0;
  realStageIndex: number = 0;
  totalStages: number = 1;
  defaultClassifications: IClassification[] = [];
  stagePercentage: number = 0;
  initiated: boolean = false;
  finished: boolean = false;
  categoryInput: string = "";
  classificationInput: string = "";
  allClassificationsCreated: boolean = false;
  closedClassificationIndex = 0;
  closedCategoriesIndex = 0;
  indicationLabel = "";
  closedQuestions: boolean = false;
  stopProgress: boolean = false;
  stopProgressDialogShown: boolean = false;
  endingText: string = "";
  selectedImageMaximized: any;
  maximized = false;

  constructor(
    private readonly httpClient: HttpClient,
    private toastr: ToastrService,
    private readonly dialog: MatDialog,
    private route: ActivatedRoute
  ) { }

  updatePercentage() {
    this.stagePercentage = (this.stageIndex / this.totalStages) * 100
  }

  loadCardsNames() {
    this.namedCards = this.savedCards.map((card: any) => {
      return card.name;
    });
  }

  ngOnInit(): void {
    this.startLoading();
    this.httpClient.get(`${environment.baseURL}get/project?projectId=${this.route.snapshot.queryParamMap.get("projectId")!}`).subscribe((response: any) => {
      this.minOpenQuestionsCnt = response.minOpenQuestionsCnt;
      this.endingText = response.endingText;
      this.httpClient.get(`${environment.baseURL}get/cards?projectId=${this.route.snapshot.queryParamMap.get("projectId")}`).subscribe((response: any) => {
        this.savedCards = response.cards;
        this.loadCardsNames();
        this.httpClient.get(`${environment.baseURL}get/classifications/default?limit=100&page=1&projectId=${this.route.snapshot.queryParamMap.get("projectId")}`).subscribe((response: any) => {
          this.defaultClassifications = response.classifications;
          this.totalStages = response.count + this.minOpenQuestionsCnt;
          this.updatePercentage();
          Swal.close();
        });
      });
    });
  }

  startLoading() {
    Swal.fire({ title: "Cargando", allowOutsideClick: false });
    Swal.showLoading();
  }

  toggleMaximize(imageURL: string) {
    const dialogRef = this.dialog.open(ImageViewerComponent, {
      width: '80%',
      height: '70%',
      data: { imageURL: imageURL }
    })
  }

  setClosedClassification() {
    this.indicationLabel = this.defaultClassifications[this.closedClassificationIndex].indication || "";
    this.classificationInput = this.defaultClassifications[this.closedClassificationIndex].name;
    this.categories = this.defaultClassifications[this.closedClassificationIndex].categories.map((category: any) => {
      const { _id, deleted, classificationId, ...rest } = category;
      return {
        ...rest,
        cards: []
      }
    })
    this.closedClassificationIndex++;
  }

  loadNewClassification() {
    this.classificationInput = "";
    this.categories = [];
    this.categoryCtn = 1;
    this.loadCardsNames();
    if (this.closedQuestions && !this.finished) {
      this.setClosedClassification();
    }
    if (!this.finished) {
      Swal.close();
    }
  }

  startClosedQuestions() {
    this.closedQuestions = true;
    this.classificationStageLabel = Math.floor(this.classificationStageLabel) + 0.1;
    this.classificationStageLabel += 1;
  }

  sendClassification() {
    let classification: any = {
      name: this.classificationInput,
      closed: this.closedQuestions,
      code: this.realStageIndex,
      projectId: sessionStorage.getItem('projectId')!,
      static: false,
    };

    this.startLoading();

    let formattedCategories = this.categories.map((category: any) => {
      return {
        ...category,
        closed: this.closedQuestions,
        static: false,
        projectId: sessionStorage.getItem('projectId'),
        cardsId: category.cards.map((card: any) => {
          return this.savedCards.find((savedCard: any) => {
            return savedCard.name == card;
          })?._id;
        })
      }
    })
    formattedCategories = formattedCategories.map((category: any) => {
      const { cards, ...rest } = category;
      return rest;
    })

    classification.categories = formattedCategories;
    this.classificationBodies.push(classification);

    if (this.stageIndex == this.minOpenQuestionsCnt - 1 && !this.stopProgressDialogShown) {
      Swal.close();
      const dialogRef = this.dialog.open(MultipleClassificationsDialogComponent, {
        width: '300px',
      }).afterClosed().subscribe(result => {
        this.stopProgressDialogShown = true;
        if (result.action == "stop") {
          this.stopProgress = true;
        } else {
          this.startClosedQuestions();
        }
        this.increaseStage();
        this.loadNewClassification();
      });
    } else {
      this.increaseStage();
      this.loadNewClassification();
    }
  }

  increaseStage() {
    this.realStageIndex++;
    if (!this.stopProgress) {
      this.stageIndex++;
      this.updatePercentage();
    }
    this.classificationStageLabel += 0.1;
    this.classificationStageLabel = parseFloat(this.classificationStageLabel.toFixed(1));
    if (this.stageIndex == this.totalStages - 1 && this.closedQuestions) {
      this.allClassificationsCreated = true;
    }
  }

  disableStopProgress() {
    this.stopProgress = false;
    this.stageIndex++;
    this.updatePercentage();
    this.startClosedQuestions();
    this.loadNewClassification();
  }

  checkClassification() {
    let valid = false;
    if (this.categories.length < 2) {
      this.toastr.warning('Debe crear al menos dos categorías');
    } else if (this.namedCards.length > 0) {
      this.toastr.warning('Debe clasificar todos los elementos');
    } else if (this.classificationInput == "") {
      this.toastr.warning('Debe dar un nombre al criterio');
    } else if (this.categories.some((category) => category.cards.length == 0)) {
      this.toastr.warning('No pueden haber categorías vacías');
    } else if (this.classificationInput.trim() === "") {
      this.toastr.warning('Debe dar un nombre al criterio');
    } else if (this.classificationBodies.some((classificationBody: any) => classificationBody.name == this.classificationInput)) {
      this.toastr.warning('No pueden haber criterios con el mismo nombre');
    } else {
      valid = true;
    }

    return valid;
  }

  nextStage() {
    if (this.stageIndex < this.totalStages - 1) {
      let valid = this.checkClassification();
      if (valid) {
        this.sendClassification();
      }
    } else {
      let valid = this.checkClassification();
      if (!valid) {
        return;
      }
      this.stageIndex++;
      this.indicationLabel = "";
      this.finished = true;
      this.sendClassification();
      this.updatePercentage();
      Swal.fire({ title: "Cargando", allowOutsideClick: false });
      Swal.showLoading();
      this.httpClient.post(`${environment.baseURL}create/participant`, this.userBody).subscribe({
        next: (response: any) => {
          sessionStorage.setItem('participantId', response.id);
          this.classificationBodies = this.classificationBodies.map((classificationBody: any) => {
            return {
              ...classificationBody,
              participantId: response.id,
            }
          })

          let classificationRequests: Promise<any>[] = [];

          this.classificationBodies.forEach((classificationBody: any) => {
            let categoryRequests: Promise<any>[] = [];
            classificationRequests.push(
              new Promise(async (resolve, reject) => {
                this.httpClient.post(`${environment.baseURL}create/classification`, classificationBody).subscribe({
                  next: (response: any) => {
                    classificationBody.categories = classificationBody.categories.map((category: any) => {
                      return {
                        ...category,
                        classificationId: response.id
                      }
                    })
                    classificationBody.categories.forEach((category: any) => {
                      categoryRequests.push(
                        new Promise(async (resolve, reject) => {
                          this.httpClient.post(`${environment.baseURL}create/category`, category).subscribe({
                            next: (response: any) => {
                              Swal.close();
                              Swal.fire({
                                title: this.endingText,
                                allowOutsideClick: false,
                                showConfirmButton: false
                              })
                              resolve(response);
                            },
                            error: (err: any) => reject(err)
                          })
                        })
                      )
                    });
                    Promise.all(categoryRequests).then(resolve).catch(reject);
                  },
                  error: (err: any) => reject(err)
                })
              })
            )
          });
          Promise.all(classificationRequests).catch(() => {
            Swal.close();
            this.toastr.error('Error al guardar los datos. Por favor intente nuevamente.');
            this.finished = false;
          });
        },
        error: () => {
          Swal.close();
          this.toastr.error('Error al guardar los datos. Por favor intente nuevamente.');
          this.finished = false;
        }
      });
    }
  }

  addCategory() {
    if (this.categoryInput.trim() === "") {
      this.toastr.warning('Debe dar un nombre a la categoría');
    } else if (this.categories.some((category) => category.name == this.categoryInput)) {
      this.toastr.warning('No pueden haber categorías con el mismo nombre');
    } else {
      this.categories.push({ name: this.categoryInput, code: this.categoryCtn, cards: [] })
      this.categoryInput = "";
      this.categoryCtn++;
    }
  }

  removeCategory(category: any) {
    this.namedCards.push(...category.cards)
    this.categories.splice(this.categories.findIndex((cat: any) => cat.code == category.code), 1);
    this.categories = this.categories.map((cat: any, index: number) => {
      return {
        ...cat,
        code: index + 1
      }
    })
    this.categoryCtn = this.categories.length + 1;
  }

  getCard(cardName: string) {
    return this.savedCards?.find((savedCard: any) => savedCard.name == cardName);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
