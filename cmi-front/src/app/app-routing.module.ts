import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './admin/login/login.component';
import { StepperComponent } from './stepper/stepper.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { SignupComponent } from './admin/signup/signup.component';

const routes: Routes = [
  {
    path: '',
    component: StepperComponent 
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'admin',
    component: AdminPanelComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
