import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ProgressSummary } from '../models/progress-summary.model';
import { Iteration } from '../models/iteration.model';
import { Microincremento } from '../models/microincrement.model';

export const _IP = 'http://localhost:6002/';
export const API_URL = _IP + 'api/project';
export const API_URL_PROGRESS = _IP + 'api/progress';
export const API_URL_MICROINCREMENT = _IP + 'api/microincrement';

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

  deactivateProject(strProjectId: string) {
    return this.http.put<any>(`${API_URL}/deactivateProject/${strProjectId}`, {}, httpOptions);
  }

  postProgress(progressData: any) {
    return this.http.post<any>(`${API_URL_PROGRESS}/postProgress`, progressData, httpOptions);
  }

  getProgress(projectId: string) {
    return this.http.get<{ Result: Iteration[] } & any>(`${API_URL_PROGRESS}/getProgress/${projectId}`);
  }

  updateProgress(progressId: string, updates: any) {
    const body = {
      _id: progressId,
      updates: updates
    };
    return this.http.put<any>(`${API_URL_PROGRESS}/updateProgress`, body, httpOptions);
  }

  getSummary(projectId: string) {
    return this.http.get<{ Result: ProgressSummary } & any>(`${API_URL_PROGRESS}/getSummary/${projectId}`);
  }

  getHistory(projectId: string) {
    return this.http.get<any>(`${API_URL_PROGRESS}/getHistory/${projectId}`);
  }

  postMicroincrement(microincremento: Omit<Microincremento, '_id' | 'status' | 'creationDate'>) {
    return this.http.post<any>(`${API_URL_MICROINCREMENT}/postMicroincrement`, microincremento, httpOptions);
  }

  getMicroincrementList(projectId: string, iteration?: string, deliverable?: string, author?: string) {
    let params = new HttpParams();
    if (projectId) {
      params = params.append('projectId', projectId);
    }
    if (iteration) {
      params = params.append('iteration', iteration);
    }
    if (deliverable) {
      params = params.append('deliverable', deliverable);
    }
    if (author) {
      params = params.append('author', author);
    }
    return this.http.get<any>(`${API_URL_MICROINCREMENT}/getMicroincrementList`, { params });
  }
}

