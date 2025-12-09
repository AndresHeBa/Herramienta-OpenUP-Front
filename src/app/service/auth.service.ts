import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:6002/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage al iniciar
    const storedUser = this.loadUserFromStorage();
    if (storedUser) {
      this.currentUserSubject.next(storedUser);
    }
  }

  private loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.intCode === 200 && response.data) {
            this.currentUserSubject.next(response.data);
            localStorage.setItem('currentUser', JSON.stringify(response.data));
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
          // Forzar recarga para limpiar la sesión completamente
          setTimeout(() => window.location.href = '/login', 100);
        })
      );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }

  hasPermission(action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin tiene todos los permisos
    if (this.hasRole('admin')) return true;

    // Mapeo simple de acciones a roles
    const permissionMap: { [key: string]: string[] } = {
      'create': ['author', 'admin'],
      'edit': ['author', 'admin'],
      'approve': ['revisor', 'PO', 'admin'],
      'change_state': ['revisor', 'PO', 'admin']
    };

    const allowedRoles = permissionMap[action] || [];
    return this.hasAnyRole(allowedRoles);
  }

  // Métodos para gestión de usuarios (solo admin)
  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`);
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
  }

  createUser(username: string, email: string, password: string, roles: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, { username, email, password, roles });
  }

  updateUser(userId: string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, updates);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${userId}`);
  }
}
