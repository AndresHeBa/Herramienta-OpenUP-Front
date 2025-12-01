import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  base = 'http://localhost:6002/api/permisos';
  constructor(private http: HttpClient) {}

  getPermissions(): Observable<any> { return this.http.get(`${this.base}/permissions`); }
  getPermission(action: string): Observable<any> { return this.http.get(`${this.base}/permissions/${action}`); }
  replacePermissions(data: any): Observable<any> { return this.http.put(`${this.base}/permissions`, { data }); }
  patchPermission(action: string, roles: string[]): Observable<any> { return this.http.patch(`${this.base}/permissions/${action}`, { roles }); }

  getRoles(): Observable<any> { return this.http.get(`${this.base}/roles`); }
  createRole(role: any): Observable<any> { return this.http.post(`${this.base}/roles`, role); }
  deleteRole(name: string): Observable<any> { return this.http.delete(`${this.base}/roles/${name}`); }
  updateRole(name: string, role: any): Observable<any> { return this.http.patch(`${this.base}/roles/${name}`, role); }
}
