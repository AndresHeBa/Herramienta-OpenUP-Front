import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from './service/auth.service';
import { Observable } from 'rxjs';
import { User } from './models/user.model';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterModule, MatIconModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'OpenUP';
  currentUser$: Observable<User | null>;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Limpiar localmente aunque falle el backend
        this.router.navigate(['/login']);
      }
    });
  }
}
