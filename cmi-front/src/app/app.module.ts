import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { UserFormComponent } from './stepper/user-form/user-form.component';
import { VideoGuideComponent } from './stepper/video-guide/video-guide.component';
import { CardExerciseComponent } from './stepper/card-exercise/card-exercise.component';
import { IntroInfoComponent } from './components/intro-info/intro-info.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { FileSaverModule } from 'ngx-filesaver';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { NgFor } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { LoginComponent } from './admin/login/login.component';
import { StepperComponent } from './stepper/stepper.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CardFormDialogComponent } from './components/card-form-dialog/card-form-dialog.component';
import { ClassificationFormDialogComponent } from './components/classification-form-dialog/classification-form-dialog.component';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { getSpanishPaginatorIntl } from './utils/constants/custom-paginator-labels';
import { MultipleClassificationsDialogComponent } from './components/multiple-classifications-dialog/multiple-classifications-dialog.component';
import { ProjectFormDialogComponent } from './components/project-form-dialog/project-form-dialog.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component';
import { SignupComponent } from './admin/signup/signup.component';
import { PasswordFormDialogComponent } from './components/password-form-dialog/password-form-dialog.component';
import { LinkUserDialogComponent } from './components/link-user-dialog/link-user-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    UserFormComponent,
    VideoGuideComponent,
    CardExerciseComponent,
    IntroInfoComponent,
    LoginComponent,
    StepperComponent,
    AdminPanelComponent,
    CardFormDialogComponent,
    PasswordFormDialogComponent,
    ClassificationFormDialogComponent,
    MultipleClassificationsDialogComponent,
    ImageViewerComponent,
    ProjectFormDialogComponent,
    LinkUserDialogComponent,
    SignupComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatStepperModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    FileSaverModule,
    MatPaginatorModule,
    MatDialogModule,
    MatCheckboxModule,
    CdkDropListGroup,
    CdkDropList,
    NgFor,
    CdkDrag,
    MatTableModule,
    HttpClientModule,
    MatProgressBarModule,
    MatIconModule,
    MatSidenavModule,
    ToastrModule.forRoot()
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
