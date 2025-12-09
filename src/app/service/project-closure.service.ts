import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// HU-026: Project Closure Service

export interface ValidationResult {
  canClose: boolean;
  missingArtifacts: MissingArtifact[];
  warnings: ArtifactWarning[];
  projectId: string;
  projectName: string;
  projectIdentifier: string;
  currentStatus: string;
}

export interface MissingArtifact {
  phase: string;
  artifactType: string;
  reason: 'not_found' | 'not_delivered';
}

export interface ArtifactWarning {
  phase: string;
  artifactType: string;
  currentStatus: string;
  version: number;
  reason: string;
}

export interface CloseProjectRequest {
  projectId: string;
  forceClose?: boolean;
  justification?: string;
  closureNotes?: string;
}

export interface CloseProjectResponse {
  projectId: string;
  closureDocument: ClosureDocument;
  closedAt: string;
  closureType: 'normal' | 'forced';
}

export interface ClosureDocument {
  documentType: string;
  generatedAt: string;
  generatedBy: string;
  project: ProjectInfo;
  closureInfo: ClosureInfo;
  validation: ValidationInfo;
  artifacts: { [phase: string]: ArtifactInfo[] };
  team: TeamMember[];
  summary: ProjectSummary;
}

export interface ProjectInfo {
  id: string;
  identifier: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  responsible: string;
  tags: string[];
}

export interface ClosureInfo {
  closureType: 'normal' | 'forced';
  closedBy: string;
  closedAt: string;
  justification?: string;
  notes?: string;
}

export interface ValidationInfo {
  missingMandatoryArtifacts: MissingArtifact[];
  warnings: ArtifactWarning[];
  forcedClosure: boolean;
}

export interface ArtifactInfo {
  type: string;
  version: number;
  status: string;
  author: string;
  uploadDate: string;
  filename?: string;
  filePath?: string;
  externalLink?: string;
  isMandatory: boolean;
}

export interface TeamMember {
  username: string;
  roles: string[];
  joinedAt?: string;
}

export interface ProjectSummary {
  totalArtifacts: number;
  totalPhases: number;
  totalTeamMembers: number;
  projectDuration: string;
}

export interface ReopenProjectRequest {
  projectId: string;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectClosureService {
  private apiUrl = 'http://localhost:6002/api/project-closure';

  constructor(private http: HttpClient) {}

  /**
   * Valida si un proyecto puede cerrarse
   */
  validateClosure(projectId: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-User-Id': '1' // TODO: Get from auth service
    });

    return this.http.get<any>(
      `${this.apiUrl}/validate/${projectId}`,
      { headers }
    );
  }

  /**
   * Cierra un proyecto
   */
  closeProject(request: CloseProjectRequest): Observable<any> {
    const headers = new HttpHeaders({
      'X-User-Id': '1', // TODO: Get from auth service
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(
      `${this.apiUrl}/close`,
      request,
      { headers }
    );
  }

  /**
   * Obtiene el documento de cierre de un proyecto
   */
  getClosureDocument(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/document/${projectId}`);
  }

  /**
   * Reabre un proyecto cerrado (solo admin)
   */
  reopenProject(request: ReopenProjectRequest): Observable<any> {
    const headers = new HttpHeaders({
      'X-User-Id': '1', // TODO: Get from auth service
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(
      `${this.apiUrl}/reopen`,
      request,
      { headers }
    );
  }

  /**
   * Descarga el documento de cierre como PDF
   */
  downloadClosurePDF(projectId: string): void {
    const url = `${this.apiUrl}/download-pdf/${projectId}`;
    
    // Abrir en nueva ventana para forzar descarga
    window.open(url, '_blank');
  }

  /**
   * Formatea la lista de artefactos faltantes para mostrar
   */
  formatMissingArtifacts(missing: MissingArtifact[]): string {
    if (!missing || missing.length === 0) return '';
    
    return missing.map(m => `${m.phase}: ${m.artifactType}`).join(', ');
  }

  /**
   * Formatea warnings para mostrar
   */
  formatWarnings(warnings: ArtifactWarning[]): string {
    if (!warnings || warnings.length === 0) return '';
    
    return warnings.map(w => 
      `${w.phase}: ${w.artifactType} (estado: ${w.currentStatus})`
    ).join(', ');
  }

  /**
   * Determina el color de estado según la validación
   */
  getValidationStatusColor(validation: ValidationResult): string {
    if (validation.canClose && validation.warnings.length === 0) {
      return 'green';
    } else if (validation.canClose && validation.warnings.length > 0) {
      return 'orange';
    } else {
      return 'red';
    }
  }

  /**
   * Genera mensaje de validación para el usuario
   */
  getValidationMessage(validation: ValidationResult): string {
    if (validation.canClose && validation.warnings.length === 0) {
      return 'El proyecto cumple con todos los requisitos y puede cerrarse.';
    } else if (validation.canClose && validation.warnings.length > 0) {
      return `El proyecto puede cerrarse, pero hay ${validation.warnings.length} advertencia(s).`;
    } else {
      return `No se puede cerrar: faltan ${validation.missingArtifacts.length} artefacto(s) obligatorio(s).`;
    }
  }
}
