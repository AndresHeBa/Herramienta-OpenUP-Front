import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private baseUrl = 'http://localhost:6002/api/workflows';

  constructor(private http: HttpClient) {}

  getWorkflows(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getWorkflows`);
  }

  createWorkflow(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/createWorkflow`, payload);
  }

  updateWorkflow(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/updateWorkflow/${id}`, payload);
  }

  deleteWorkflow(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteWorkflow/${id}`);
  }
}
