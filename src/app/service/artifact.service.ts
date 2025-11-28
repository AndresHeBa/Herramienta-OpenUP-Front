import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class ArtifactService {
private baseUrl = 'http://localhost:6002/api/artifacts'; // endpoint base


constructor(private http: HttpClient) {}


uploadArtifact(formData: FormData): Observable<any> {
return this.http.post(`${this.baseUrl}/uploadArtifact`, formData, {
reportProgress: true,
observe: 'events'
});
}


getArtifacts(projectId: string, phase?: string) {
  let params = new HttpParams().set('projectId', projectId);
  if (phase) {
    params = params.set('phase', phase);
  }
  return this.http.get(`${this.baseUrl}/getArtifacts`, { params });
}



updateArtifactVersion(payload: any): Observable<any> {
return this.http.put(`${this.baseUrl}/updateArtifactVersion`, payload);
}


validateTransition(projectId: string): Observable<any> {
return this.http.post(`${this.baseUrl}/validateTransition`, { projectId });
}
}