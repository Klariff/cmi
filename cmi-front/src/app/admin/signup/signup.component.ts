import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  username: string = "";
  fullName: string = "";
  password: string = "";

  constructor(
    private toastr: ToastrService,
    private readonly httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    sessionStorage.clear();
  }

  login() {
    location.href = '/login';
  }

  signup() {
    if (this.password == null || this.password == null || this.password == "" || this.password == "") {
      this.toastr.warning('Las contraseñas no pueden estar vacias');
      return;
    } else if (this.password.length < 8) {
      this.toastr.warning('La contraseña debe tener al menos 8 caracteres');
      return;
    } else if (this.password.length > 20) {
      this.toastr.warning('La contraseña no puede tener más de 20 caracteres');
      return;
    } else if (this.password.match(/[A-Z]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos una letra mayúscula');
      return;
    } else if (this.password.match(/[a-z]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos una letra minúscula');
      return;
    } else if (this.password.match(/[0-9]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos un número');
      return;
    } else if (this.password.match(/[!@#\$%\^&\*\.]/) == null) {
      this.toastr.warning('La contraseña debe tener al menos un caracter especial');
      return;
    } else if (this.username == null || this.username == null || this.username == "" || this.username == "") {
      this.toastr.warning('El nombre de usuario no puede estar vacio');
      return;
    } else if (this.username.length < 5) {
      this.toastr.warning('El nombre de usuario debe tener al menos 5 caracteres');
      return;
    } else if (this.username.length > 20) {
      this.toastr.warning('El nombre de usuario no puede tener más de 20 caracteres');
      return;
    } else if (this.username.match(/^[a-zA-Z0-9-_]+$/) == null) {
      this.toastr.warning('El nombre de usuario solo puede tener letras, números, guiones y guiones bajos');
      return;
    } else if (this.fullName == null || this.fullName == null || this.fullName == "" || this.fullName == "") {
      this.toastr.warning('El nombre completo no puede estar vacio');
      return;
    } else if (this.fullName.length < 5) {
      this.toastr.warning('El nombre completo debe tener al menos 5 caracteres');
      return;
    } else if (this.fullName.length > 50) {
      this.toastr.warning('El nombre completo no puede tener más de 50 caracteres');
      return;
    } 
    if (this.username && this.fullName && this.password) {
      this.httpClient.post(`${environment.baseURL}create/user`, { username: this.username, fullName: this.fullName, password: this.password }).subscribe({
        next: (response: any) => {
          sessionStorage.setItem('userId', response.userId);
          sessionStorage.setItem('token', response.token);
          location.href = '/admin';
        },
        error: (error: any) => {
          if (error.status == 406) {
            this.toastr.error('El usuario ya existe');
          } else {
            this.toastr.error('Credenciales incorrectas');
          }
        },
      })
    } else {
      this.toastr.warning('Formulario inválido');
    }
  }
}
