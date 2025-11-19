import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export const _IP = 'http://localhost:6002/';
export const API_URL = _IP + 'api/project';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  body: {}
};

@Injectable({
  providedIn: 'root'
})
export class MainService {

  constructor(private http: HttpClient) { }

  getProject(strProjectId: string) {
    return this.http.get<any>(`${API_URL}/getProject/${strProjectId}`);
  }

  // projectName = body.get('projectName', '').strip()
  //       projectIdentifier = body.get('projectIdentifier', '').strip()
  //       startDate = body.get('startDate', '').strip()
  //       description = body.get('description', '').strip()
  //       responsible = body.get('responsible', '').strip()
  //       tags = body.get('tags', [])   # Puede ser lista o string
  //       active = body.get('active', True)

  postproyect(
    projectName: string, 
    projectIdentifier: string, 
    startDate: string, 
    description: string, 
    responsible: string, 
    tags: string[], 
    active: boolean) {
    const body = {
      "projectName": projectName,
      "projectIdentifier": projectIdentifier,
      "startDate": startDate,
      "description": description,
      "responsible": responsible,
      "tags": tags,
      "active": active,
    };
    return this.http.post<any>(`${API_URL}/postProject`, body, httpOptions);
  }

}

