import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = "";
  password: string = "";

  constructor(
    private toastr: ToastrService,
    private readonly httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    sessionStorage.clear();
  }

  login() {
    if (this.username && this.password) {
      this.httpClient.post(`${environment.baseURL}login`, { username: this.username, password: this.password }).subscribe({
        next: (response: any) => {
          sessionStorage.setItem('userId', response.userId);
          sessionStorage.setItem('token', response.token);
          location.href = '/admin';
        },
        error: (error: any) => {
          if (error.status == 401) {
            this.toastr.error('Credenciales incorrectas');
          } else {
            this.toastr.error('Error interno');
          }
        },
      })
    } else {
      this.toastr.warning('Formulario inválido');
    }
  }

  signup() {
    location.href = '/signup';
  }
}
