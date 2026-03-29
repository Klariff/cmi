import { Component, ViewChild, OnInit } from '@angular/core';
import { UserFormComponent } from './user-form/user-form.component';
import { VideoGuideComponent } from './video-guide/video-guide.component';
import { IntroInfoComponent } from '../components/intro-info/intro-info.component';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CardExerciseComponent } from './card-exercise/card-exercise.component';
import { PlatformLocation } from '@angular/common';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss']
})
export class StepperComponent implements OnInit {
  @ViewChild(UserFormComponent) userFormComponent!: UserFormComponent;
  @ViewChild(VideoGuideComponent) videoGuideComponent!: VideoGuideComponent | undefined;
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(CardExerciseComponent) cardExcerciseComponent!: CardExerciseComponent;
  environment = environment;

  constructor(
    public dialog: MatDialog,
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private platformLocation: PlatformLocation
  ) { 
    history.pushState(null, document.title, location.href);
    this.platformLocation.onPopState(() => {
      history.pushState(null, document.title, location.href);
    });
  }

  title = 'CMI';
  globalPromises: any = [];

  ngOnInit(): void {
    sessionStorage.clear();
    if (environment.showInitialDialog) {
      this.dialog.open(IntroInfoComponent, { width: "400px" })
    }
    if (!this.route.snapshot.queryParamMap.get("projectId")) {
      Swal.fire({ title: "Proyecto no encontrado", text: "No se ha encontrado el proyecto al que intenta acceder", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false })
    } else {
      this.httpClient.get(`${environment.baseURL}get/project?projectId=${this.route.snapshot.queryParamMap.get("projectId")}`).subscribe({
        next: (response: any) => {
          if (this.userFormComponent) {
            this.userFormComponent.introductionText = response.introductionText;
          }
          sessionStorage.setItem("projectId", this.route.snapshot.queryParamMap.get("projectId")!);
        },
        error: (error: any) => {
          if (error.status == 404) {
            Swal.fire({ title: "Proyecto no encontrado", text: "No se ha encontrado el proyecto al que intenta acceder", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false })
          } else {
            Swal.fire({ title: "Error interno de servidor", text: "Por favor contacte con el administrador", icon: "error", allowOutsideClick: false, showCancelButton: false, showConfirmButton: false })
          }
        }
      })
    }
  }

  openExcerciseStep(stepper: MatStepper): void {
    this.userFormComponent.formAttempt = true;
    this.userFormComponent.userForm.markAllAsTouched();
    if (this.userFormComponent.userForm.valid) {
      let userData = this.userFormComponent.userForm.value;
      userData.projectId = sessionStorage.getItem("projectId");
      delete userData.dataAgreement;
      delete userData.formConsent;
      Swal.fire({ title: "Cargando...", allowOutsideClick: false });
      Swal.showLoading();
      this.cardExcerciseComponent.userBody = userData;
      Swal.close();
      if (this.stepper.selected) {
        this.stepper.selected.completed = true;
        stepper.next();
      }
    }
  }

  openFormStep(stepper: MatStepper): void {
    if (this.stepper.selected) {
      this.stepper.selected.completed = true;
      sessionStorage.setItem('loaded', 'true');
      stepper.next();
    }
  }
}
