import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export const _IP = 'http://localhost:6002/';
export const API_URL_BUILDS = _IP + 'api/builds';

export interface Build {
  _id?: string;
  projectId: string;
  buildId: string;
  commitHash?: string;
  buildDate?: string;
  status: 'success' | 'failure' | 'pending' | 'in_progress';
  logs?: string;
  metadata?: any;
  artifactId?: string;
  registeredBy?: string;
  registeredAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuildService {

  constructor(private http: HttpClient) { }

  registerBuild(build: Build): Observable<any> {
    return this.http.post<any>(`${API_URL_BUILDS}/register`, build);
  }

  getBuildsForArtifact(artifactId: string): Observable<any> {
    return this.http.get<any>(`${API_URL_BUILDS}/artifact/${artifactId}`);
  }

  getBuildsForProject(projectId: string): Observable<any> {
    return this.http.get<any>(`${API_URL_BUILDS}/project/${projectId}`);
  }

  linkBuildToArtifact(buildId: string, artifactId: string): Observable<any> {
    return this.http.put<any>(`${API_URL_BUILDS}/${buildId}/link`, { artifactId });
  }

  updateBuildStatus(buildId: string, status: string, logs?: string): Observable<any> {
    const body: any = { status };
    if (logs) {
      body.logs = logs;
    }
    return this.http.put<any>(`${API_URL_BUILDS}/${buildId}/status`, body);
  }

  updateProjectRepository(projectId: string, repositoryUrl: string, repositoryType: string = 'git'): Observable<any> {
    return this.http.put<any>(`${_IP}api/projects/${projectId}/repository`, {
      repositoryUrl,
      repositoryType
    });
  }
}
