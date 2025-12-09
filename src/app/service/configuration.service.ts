import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpenUPConfiguration, Role, Phase, ArtifactType, Workflow, ConfigurationHistory } from '../models/openup-configuration.model';

export const _IP = 'http://localhost:6002/';
export const API_URL_CONFIG = _IP + 'api/configurations';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  constructor(private http: HttpClient) { }

  // ==================== CONFIGURATION CRUD ====================
  
  // Get active configuration
  getActiveConfiguration(): Observable<any> {
    return this.http.get<any>(`${API_URL_CONFIG}/active`);
  }

  // Get all configurations
  getConfigurations(): Observable<any> {
    return this.http.get<any>(`${API_URL_CONFIG}`);
  }

  // Get configuration by ID
  getConfiguration(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL_CONFIG}/${id}`);
  }

  // Create new configuration
  createConfiguration(config: Partial<OpenUPConfiguration>): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}`, config);
  }

  // Update configuration
  updateConfiguration(id: string, updates: Partial<OpenUPConfiguration>): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${id}`, updates);
  }

  // Set configuration as active
  setActiveConfiguration(id: string): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${id}/activate`, {});
  }

  // ==================== ROLES ====================
  
  addRole(configId: string, role: Role): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/${configId}/roles`, role);
  }

  updateRole(configId: string, roleId: string, role: Partial<Role>): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${configId}/roles/${roleId}`, role);
  }

  deleteRole(configId: string, roleId: string): Observable<any> {
    return this.http.delete<any>(`${API_URL_CONFIG}/${configId}/roles/${roleId}`);
  }

  // ==================== PHASES ====================
  
  addPhase(configId: string, phase: Phase): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/${configId}/phases`, phase);
  }

  updatePhase(configId: string, phaseId: string, phase: Partial<Phase>): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${configId}/phases/${phaseId}`, phase);
  }

  deletePhase(configId: string, phaseId: string): Observable<any> {
    return this.http.delete<any>(`${API_URL_CONFIG}/${configId}/phases/${phaseId}`);
  }

  // ==================== ARTIFACT TYPES ====================
  
  addArtifactType(configId: string, artifactType: ArtifactType): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/${configId}/artifact-types`, artifactType);
  }

  updateArtifactType(configId: string, artifactTypeId: string, artifactType: Partial<ArtifactType>): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${configId}/artifact-types/${artifactTypeId}`, artifactType);
  }

  deleteArtifactType(configId: string, artifactTypeId: string): Observable<any> {
    return this.http.delete<any>(`${API_URL_CONFIG}/${configId}/artifact-types/${artifactTypeId}`);
  }

  // ==================== WORKFLOWS ====================
  
  addWorkflow(configId: string, workflow: Workflow): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/${configId}/workflows`, workflow);
  }

  updateWorkflow(configId: string, workflowId: string, workflow: Partial<Workflow>): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${configId}/workflows/${workflowId}`, workflow);
  }

  deleteWorkflow(configId: string, workflowId: string): Observable<any> {
    return this.http.delete<any>(`${API_URL_CONFIG}/${configId}/workflows/${workflowId}`);
  }

  // ==================== CONFIGURATION HISTORY ====================
  
  getConfigurationHistory(configId: string): Observable<any> {
    return this.http.get<any>(`${API_URL_CONFIG}/${configId}/history`);
  }

  revertToVersion(configId: string, version: number): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/${configId}/revert/${version}`, {});
  }

  // ==================== APPLY TO PROJECTS ====================
  
  applyConfigurationToProject(configId: string, projectId: string): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/applyToProject`, { configId, projectId });
  }

  applyConfigurationToAllProjects(configId: string): Observable<any> {
    return this.http.post<any>(`${API_URL_CONFIG}/applyToAllProjects`, { configId });
  }
  
  // ==================== PERMISSIONS ====================
  
  updatePermissions(configId: string, permissions: Array<{action: string, roles: string[]}>): Observable<any> {
    return this.http.put<any>(`${API_URL_CONFIG}/${configId}/permissions`, { permissions });
  }
  
  // ==================== PROJECT CONFIGURATION ====================
  
  getProjectConfiguration(projectId: string): Observable<any> {
    return this.http.get<any>(`${API_URL_CONFIG}/project/${projectId}`);
  }
}
