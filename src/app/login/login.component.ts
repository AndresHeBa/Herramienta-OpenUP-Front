import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir a la ventana de creación
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.router.navigate(['/ventana-creacion']);
      }
    });
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingrese usuario y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          // Pequeño delay para asegurar que el BehaviorSubject se actualice
          setTimeout(() => {
            this.router.navigate(['/ventana-creacion']);
          }, 100);
        } else {
          this.errorMessage = response.data || 'Error al iniciar sesión';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.data || 'Credenciales inválidas';
        this.isLoading = false;
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.login();
  }
}
