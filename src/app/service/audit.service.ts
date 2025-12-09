import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLog {
  _id: string;
  userId: string;
  actionType: 'create' | 'edit' | 'delete' | 'status_change' | 'version_create' | 'move' | 'archive' | 'restore' | 'export' | 'import';
  entityType: 'project' | 'artifact' | 'iteration' | 'microincrement' | 'build' | 'workflow' | 'configuration' | 'plan';
  entityId?: string;
  projectId?: string;
  timestamp: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogsResponse {
  intCode: number;
  strMessage: string;
  Result: {
    logs: AuditLog[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface AuditStatsResponse {
  intCode: number;
  strMessage: string;
  Result: {
    totalActions: number;
    actionTypeStats: { _id: string; count: number; }[];
    entityTypeStats: { _id: string; count: number; }[];
    topUsers: { _id: string; count: number; }[];
  };
}

export interface AuditFilters {
  projectId?: string;
  userId?: string;
  actionType?: string | string[];
  entityType?: string | string[];
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
  sortField?: string;
  sortOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = 'http://localhost:6002/api/audit';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene logs de auditoría con filtros opcionales
   */
  getAuditLogs(filters?: AuditFilters): Observable<AuditLogsResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.projectId) params = params.set('projectId', filters.projectId);
      if (filters.userId) params = params.set('userId', filters.userId);
      
      if (filters.actionType) {
        const actionTypes = Array.isArray(filters.actionType) 
          ? filters.actionType.join(',') 
          : filters.actionType;
        params = params.set('actionType', actionTypes);
      }
      
      if (filters.entityType) {
        const entityTypes = Array.isArray(filters.entityType) 
          ? filters.entityType.join(',') 
          : filters.entityType;
        params = params.set('entityType', entityTypes);
      }
      
      if (filters.entityId) params = params.set('entityId', filters.entityId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.skip) params = params.set('skip', filters.skip.toString());
      if (filters.sortField) params = params.set('sortField', filters.sortField);
      if (filters.sortOrder !== undefined) params = params.set('sortOrder', filters.sortOrder.toString());
    }

    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/logs`, { params });
  }

  /**
   * Obtiene el historial de auditoría de un proyecto específico
   */
  getProjectAuditHistory(projectId: string, limit: number = 100, skip: number = 0): Observable<AuditLogsResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('skip', skip.toString());

    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/project/${projectId}`, { params });
  }

  /**
   * Obtiene el historial de auditoría de una entidad específica
   */
  getEntityAuditHistory(entityType: string, entityId: string, limit: number = 50, skip: number = 0): Observable<AuditLogsResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('skip', skip.toString());

    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/entity/${entityType}/${entityId}`, { params });
  }

  /**
   * Obtiene el historial de acciones de un usuario
   */
  getUserAuditHistory(userId: string, limit: number = 100, skip: number = 0, startDate?: string, endDate?: string): Observable<AuditLogsResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('skip', skip.toString());

    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/user/${userId}`, { params });
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  getAuditStats(projectId?: string, startDate?: string, endDate?: string): Observable<AuditStatsResponse> {
    let params = new HttpParams();

    if (projectId) params = params.set('projectId', projectId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<AuditStatsResponse>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Exporta logs de auditoría en formato JSON
   */
  exportAuditLogsJSON(filters?: AuditFilters): Observable<any> {
    let params = new HttpParams().set('format', 'json');

    if (filters) {
      if (filters.projectId) params = params.set('projectId', filters.projectId);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.actionType) {
        const actionTypes = Array.isArray(filters.actionType) 
          ? filters.actionType.join(',') 
          : filters.actionType;
        params = params.set('actionType', actionTypes);
      }
      if (filters.entityType) {
        const entityTypes = Array.isArray(filters.entityType) 
          ? filters.entityType.join(',') 
          : filters.entityType;
        params = params.set('entityType', entityTypes);
      }
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get(`${this.apiUrl}/export`, { params });
  }

  /**
   * Exporta logs de auditoría en formato CSV
   */
  exportAuditLogsCSV(filters?: AuditFilters): Observable<Blob> {
    let params = new HttpParams().set('format', 'csv');

    if (filters) {
      if (filters.projectId) params = params.set('projectId', filters.projectId);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.actionType) {
        const actionTypes = Array.isArray(filters.actionType) 
          ? filters.actionType.join(',') 
          : filters.actionType;
        params = params.set('actionType', actionTypes);
      }
      if (filters.entityType) {
        const entityTypes = Array.isArray(filters.entityType) 
          ? filters.entityType.join(',') 
          : filters.entityType;
        params = params.set('entityType', entityTypes);
      }
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get(`${this.apiUrl}/export`, { 
      params,
      responseType: 'blob'
    });
  }

  /**
   * Helper para descargar un blob como archivo
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper para descargar JSON
   */
  downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Traduce tipo de acción a español
   */
  getActionTypeLabel(actionType: string): string {
    const labels: { [key: string]: string } = {
      'create': 'Crear',
      'edit': 'Editar',
      'delete': 'Eliminar',
      'status_change': 'Cambio de Estado',
      'version_create': 'Nueva Versión',
      'move': 'Mover',
      'archive': 'Archivar',
      'restore': 'Restaurar',
      'export': 'Exportar',
      'import': 'Importar'
    };
    return labels[actionType] || actionType;
  }

  /**
   * Traduce tipo de entidad a español
   */
  getEntityTypeLabel(entityType: string): string {
    const labels: { [key: string]: string } = {
      'project': 'Proyecto',
      'artifact': 'Artefacto',
      'iteration': 'Iteración',
      'microincrement': 'Microincremento',
      'build': 'Build',
      'workflow': 'Flujo de Trabajo',
      'configuration': 'Configuración',
      'plan': 'Plan'
    };
    return labels[entityType] || entityType;
  }

  /**
   * Obtiene el color asociado a un tipo de acción
   */
  getActionTypeColor(actionType: string): string {
    const colors: { [key: string]: string } = {
      'create': '#4caf50',
      'edit': '#2196f3',
      'delete': '#f44336',
      'status_change': '#ff9800',
      'version_create': '#9c27b0',
      'move': '#00bcd4',
      'archive': '#795548',
      'restore': '#8bc34a',
      'export': '#607d8b',
      'import': '#3f51b5'
    };
    return colors[actionType] || '#9e9e9e';
  }
}
