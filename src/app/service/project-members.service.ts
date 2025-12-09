import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface ProjectRole {
  id: string;
  name: string;
  description: string;
}

export interface MemberInvitation {
  _id: string;
  projectId: string;
  userId: string;
  roles: string[];
  status: 'pending' | 'active' | 'rejected' | 'removed';
  invitedBy: string;
  invitedAt: string;
  notificationEmail?: string;
  notificationSent?: boolean;
  acceptedAt?: string;
  rejectedAt?: string;
  removedAt?: string;
  userInfo?: {
    username: string;
    email: string;
    active: boolean;
  };
  inviterInfo?: {
    username: string;
  };
  projectInfo?: {
    name: string;
    identifier: string;
    description: string;
  };
}

export interface ProjectMember extends MemberInvitation {
  updatedAt?: string;
  updatedBy?: string;
  removedBy?: string;
}

export interface ProjectMembersResponse {
  intCode: number;
  strMessage: string;
  data: {
    members: ProjectMember[];
    totalCount: number;
    projectId: string;
    projectName: string;
    projectIdentifier: string;
  };
}

export interface UserProjectsResponse {
  intCode: number;
  strMessage: string;
  data: {
    projects: any[];
    totalCount: number;
  };
}

export interface InvitationsResponse {
  intCode: number;
  strMessage: string;
  data: {
    invitations: MemberInvitation[];
    totalCount: number;
  };
}

export interface RolesResponse {
  intCode: number;
  strMessage: string;
  data: {
    roles: ProjectRole[];
    totalCount: number;
  };
}

export interface AccessCheckResponse {
  intCode: number;
  strMessage: string;
  data: {
    hasAccess: boolean;
    roles: string[];
    status: string | null;
    memberId?: string;
    error?: string;
  };
}

export interface InviteMemberRequest {
  projectId: string;
  userId: string;
  roles: string[];
  invitedBy: string;
  notificationEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectMembersService {
  private apiUrl = 'http://localhost:6002/api/project-members';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de roles disponibles para proyectos
   */
  getAvailableRoles(): Observable<RolesResponse> {
    return this.http.get<RolesResponse>(`${this.apiUrl}/roles`);
  }

  /**
   * Invita un usuario a un proyecto
   */
  inviteMember(request: InviteMemberRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invite`, request);
  }

  /**
   * Acepta una invitación a un proyecto
   */
  acceptInvitation(invitationId: string, userId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/accept/${invitationId}`, { userId });
  }

  /**
   * Rechaza una invitación a un proyecto
   */
  rejectInvitation(invitationId: string, userId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reject/${invitationId}`, { userId });
  }

  /**
   * Obtiene los miembros de un proyecto
   */
  getProjectMembers(projectId: string, status?: string | string[]): Observable<ProjectMembersResponse> {
    let url = `${this.apiUrl}/project/${projectId}`;
    
    if (status) {
      const statusParam = Array.isArray(status) ? status.join(',') : status;
      url += `?status=${statusParam}`;
    }
    
    return this.http.get<ProjectMembersResponse>(url);
  }

  /**
   * Actualiza los roles de un miembro
   */
  updateMemberRoles(memberId: string, roles: string[], updatedBy: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-roles/${memberId}`, {
      roles,
      updatedBy
    });
  }

  /**
   * Remueve un miembro del proyecto
   */
  removeMember(memberId: string, removedBy: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/remove/${memberId}`, {
      body: { removedBy }
    });
  }

  /**
   * Obtiene los proyectos de un usuario
   */
  getUserProjects(userId: string, status: string = 'active'): Observable<UserProjectsResponse> {
    return this.http.get<UserProjectsResponse>(
      `${this.apiUrl}/user/${userId}/projects?status=${status}`
    );
  }

  /**
   * Verifica si un usuario tiene acceso a un proyecto
   */
  checkUserProjectAccess(userId: string, projectId: string, requiredRole?: string): Observable<AccessCheckResponse> {
    return this.http.post<AccessCheckResponse>(`${this.apiUrl}/check-access`, {
      userId,
      projectId,
      requiredRole
    });
  }

  /**
   * Obtiene las invitaciones pendientes de un usuario
   */
  getPendingInvitations(userId: string): Observable<InvitationsResponse> {
    return this.http.get<InvitationsResponse>(`${this.apiUrl}/user/${userId}/invitations`);
  }

  /**
   * Helpers para obtener labels y colores
   */
  getRoleLabel(roleId: string): string {
    const labels: { [key: string]: string } = {
      'author': 'Autor',
      'reviewer': 'Revisor',
      'po': 'Product Owner',
      'sm': 'Scrum Master',
      'developer': 'Desarrollador',
      'tester': 'Tester',
      'admin': 'Admin'
    };
    return labels[roleId] || roleId;
  }

  getRoleColor(roleId: string): string {
    const colors: { [key: string]: string } = {
      'author': 'blue',
      'reviewer': 'purple',
      'po': 'green',
      'sm': 'orange',
      'developer': 'cyan',
      'tester': 'pink',
      'admin': 'red'
    };
    return colors[roleId] || 'gray';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'active': 'Activo',
      'rejected': 'Rechazado',
      'removed': 'Removido'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'warning',
      'active': 'success',
      'rejected': 'danger',
      'removed': 'secondary'
    };
    return colors[status] || 'secondary';
  }
}
