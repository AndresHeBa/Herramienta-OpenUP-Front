import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ProgressSummary } from '../models/progress-summary.model';
import { Iteration } from '../models/iteration.model';
import { Microincremento } from '../models/microincrement.model';

export const _IP = 'http://localhost:6002/';
export const API_URL = _IP + 'api/project';
export const API_URL_PROGRESS = _IP + 'api/progress';
export const API_URL_MICROINCREMENT = _IP + 'api/microincrement';
export const API_URL_ITERACION = _IP + 'api/iteracion';
export const API_URL_PLAN = _IP + 'api/plan';

@Injectable({
  providedIn: 'root'
})
export class MainService {

  constructor(private http: HttpClient) { }

  getProject(strProjectId: string) {
    return this.http.get<any>(`${API_URL}/getProject/${strProjectId}`);
  }

  getProjects(){
    return this.http.get<any>(`${API_URL}/getProjectList`);
  }

  postproyect(
    projectName: string,
    projectIdentifier: string,
    startDate: string,
    description: string,
    responsible: string,
    tags: string[],
    phases: string[],
    configurationId: string | null,
    active: boolean,
    repositoryUrl?: string) {
    const body: any = {
      "projectName": projectName,
      "projectIdentifier": projectIdentifier,
      "startDate": startDate,
      "description": description,
      "responsible": responsible,
      "tags": tags,
      "phases": phases,
      "active": active,
    };
    
    if (configurationId) {
      body.configurationId = configurationId;
    }
    
    // HU-022: Add repository information
    if (repositoryUrl) {
      body.repositoryUrl = repositoryUrl;
      body.repositoryType = 'git';
    }
    
    return this.http.post<any>(`${API_URL}/postProject`, body);
  }

  updateProject(
    projectId: string,
    projectName: string,
    projectIdentifier: string,
    startDate: string,
    description: string,
    responsible: string,
    tags: string[],
    repositoryUrl?: string
  ) {
    const body: any = {
      "_id": projectId,
      "name": projectName,
      "identifier": projectIdentifier,
      "startDate": startDate,
      "description": description,
      "responsible": responsible,
      "tags": tags
    };
    
    if (repositoryUrl) {
      body.repositoryUrl = repositoryUrl;
    }
    
    return this.http.put<any>(`${API_URL}/updateProject`, body);
  }

  deactivateProject(strProjectId: string) {
    return this.http.put<any>(`${API_URL}/deactivateProject/${strProjectId}`, {});
  }

  postProgress(progressData: any) {
    return this.http.post<any>(`${API_URL_PROGRESS}/postProgress`, progressData);
  }

  getProgress(projectId: string) {
    return this.http.get<{ Result: Iteration[] } & any>(`${API_URL_PROGRESS}/getProgress/${projectId}`);
  }

  updateProgress(progressId: string, updates: any) {
    const body = {
      _id: progressId,
      updates: updates
    };
    return this.http.put<any>(`${API_URL_PROGRESS}/updateProgress`, body);
  }

  getSummary(projectId: string) {
    return this.http.get<{ Result: ProgressSummary } & any>(`${API_URL_PROGRESS}/getSummary/${projectId}`);
  }

  getHistory(projectId: string) {
    return this.http.get<any>(`${API_URL_PROGRESS}/getHistory/${projectId}`);
  }

  postMicroincrement(microincremento: Omit<Microincremento, '_id' | 'status' | 'creationDate'>) {
    return this.http.post<any>(`${API_URL_MICROINCREMENT}/postMicroincrement`, microincremento);
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

  // ==================== ITERACIONES CRUD ====================
  
  // CREATE - Crear nueva iteración
  postIteracion(
    projectId: string, 
    name: string, 
    startDate: string, 
    finallyDate: string, 
    goal: string, 
    phase: string, 
    active: boolean,
    tasks?: any[],
    blockers?: string,
    observations?: string
  ) {
    const body = {
      "projectIdentifier": projectId,
      "name": name,
      "startDate": startDate,
      "finallyDate": finallyDate,
      "goal": goal,
      "phase": phase,
      "active": active,
      "tasks": tasks || [],
      "blockers": blockers || "",
      "observations": observations || ""
    };
    return this.http.post<any>(`${API_URL_ITERACION}/postInteracion`, body);
  }

  // READ - Obtener todas las iteraciones de un proyecto
  getIteraciones(projectId: string) {
    return this.http.get<any>(`${API_URL_ITERACION}/getIteraciones/${projectId}`);
  }

  // READ - Obtener una iteración específica
  getIteracion(projectId: string, iterationName: string) {
    return this.http.get<any>(`${API_URL_ITERACION}/getIteracion/${projectId}/${iterationName}`);
  }

  // UPDATE - Actualizar iteración completa
  putIteracion(
    projectId: string, 
    iterationName: string, 
    updates: {
      startDate?: string;
      finallyDate?: string;
      goal?: string;
      phase?: string;
      active?: boolean;
      tasks?: any[];
      blockers?: string;
      observations?: string;
    }
  ) {
    return this.http.put<any>(
      `${API_URL_ITERACION}/putIteracion/${projectId}/${iterationName}`, 
      updates
    );
  }

  // UPDATE - Actualizar solo progreso de tareas
  updateIterationProgress(projectId: string, iterationName: string, tasks: any[]) {
    const body = { tasks };
    return this.http.patch<any>(
      `${API_URL_ITERACION}/updateProgress/${projectId}/${iterationName}`, 
      body
    );
  }

  // DELETE - Eliminar iteración
  deleteIteracion(projectId: string, iterationName: string) {
    return this.http.delete<any>(
      `${API_URL_ITERACION}/deleteIteracion/${projectId}/${iterationName}`
    );
  }

  // ==================== PLAN CRUD ====================

  // CREATE - Crear plan de proyecto
  postPlan(
    projectId: string,
    objectives: string,
    scope: string,
    initialSchedule: any,
    phaseResponsibles: any,
    milestones: any[],
    observations: string,
    version: string
  ) {
    const body = {
      projectId,
      objectives,
      scope,
      initialSchedule,
      phaseResponsibles,
      milestones,
      observations,
      version
    };
    return this.http.post<any>(`${API_URL_PLAN}/postPlan`, body);
  }

  // READ - Obtener plan de proyecto
  getPlan(projectId: string) {
    return this.http.get<any>(`${API_URL_PLAN}/getPlan/${projectId}`);
  }

  // UPDATE - Actualizar plan
  updatePlan(planId: string, updates: any) {
    const body = {
      _id: planId,
      updates
    };
    return this.http.put<any>(`${API_URL_PLAN}/updatePlan`, body);
  }
}