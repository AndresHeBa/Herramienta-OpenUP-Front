import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ProjectMembersService, 
  ProjectMember, 
  ProjectRole,
  InviteMemberRequest 
} from '../service/project-members.service';

@Component({
  selector: 'app-project-members',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.css'
})
export class ProjectMembersComponent implements OnInit {
  @Input() projectId!: string;
  @Input() currentUserId: string = '1'; // TODO: Obtener del AuthService
  @Output() closeModal = new EventEmitter<void>();

  members: ProjectMember[] = [];
  availableRoles: ProjectRole[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Para invitar nuevo miembro
  showInviteForm = false;
  inviteForm = {
    userId: '',
    username: '',
    email: '',
    selectedRoles: [] as string[]
  };
  
  // Para editar roles
  editingMember: ProjectMember | null = null;
  editRoles: string[] = [];
  
  // Filtros
  statusFilter: string = 'all';

  constructor(public membersService: ProjectMembersService) {}

  ngOnInit(): void {
    this.loadAvailableRoles();
    this.loadMembers();
  }

  loadAvailableRoles(): void {
    this.membersService.getAvailableRoles().subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.availableRoles = response.data.roles;
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  loadMembers(): void {
    this.isLoading = true;
    this.error = null;
    
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;
    
    this.membersService.getProjectMembers(this.projectId, status).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.members = response.data.members;
        } else {
          this.error = response.strMessage;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.error = 'Error al cargar los miembros del proyecto';
        this.isLoading = false;
      }
    });
  }

  onStatusFilterChange(): void {
    this.loadMembers();
  }

  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    if (!this.showInviteForm) {
      this.resetInviteForm();
    }
  }

  resetInviteForm(): void {
    this.inviteForm = {
      userId: '',
      username: '',
      email: '',
      selectedRoles: []
    };
  }

  toggleRoleSelection(roleId: string): void {
    const index = this.inviteForm.selectedRoles.indexOf(roleId);
    if (index > -1) {
      this.inviteForm.selectedRoles.splice(index, 1);
    } else {
      this.inviteForm.selectedRoles.push(roleId);
    }
  }

  isRoleSelected(roleId: string): boolean {
    return this.inviteForm.selectedRoles.includes(roleId);
  }

  inviteMember(): void {
    if (!this.inviteForm.userId || this.inviteForm.selectedRoles.length === 0) {
      alert('Debes ingresar un ID de usuario y seleccionar al menos un rol');
      return;
    }

    const request: InviteMemberRequest = {
      projectId: this.projectId,
      userId: this.inviteForm.userId,
      roles: this.inviteForm.selectedRoles,
      invitedBy: this.currentUserId,
      notificationEmail: this.inviteForm.email || undefined
    };

    this.isLoading = true;
    
    this.membersService.inviteMember(request).subscribe({
      next: (response) => {
        if (response.intCode === 201) {
          alert('Invitación enviada correctamente');
          this.toggleInviteForm();
          this.loadMembers();
        } else {
          alert(response.strMessage || 'Error al enviar invitación');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error inviting member:', error);
        alert('Error al enviar la invitación');
        this.isLoading = false;
      }
    });
  }

  startEditRoles(member: ProjectMember): void {
    this.editingMember = member;
    this.editRoles = [...member.roles]; // Copiar array
  }

  cancelEditRoles(): void {
    this.editingMember = null;
    this.editRoles = [];
  }

  toggleEditRole(roleId: string): void {
    const index = this.editRoles.indexOf(roleId);
    if (index > -1) {
      this.editRoles.splice(index, 1);
    } else {
      this.editRoles.push(roleId);
    }
  }

  isEditRoleSelected(roleId: string): boolean {
    return this.editRoles.includes(roleId);
  }

  saveRoles(): void {
    if (!this.editingMember || this.editRoles.length === 0) {
      alert('Debes seleccionar al menos un rol');
      return;
    }

    this.isLoading = true;
    
    this.membersService.updateMemberRoles(
      this.editingMember._id,
      this.editRoles,
      this.currentUserId
    ).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          alert('Roles actualizados correctamente');
          this.cancelEditRoles();
          this.loadMembers();
        } else {
          alert(response.strMessage || 'Error al actualizar roles');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating roles:', error);
        alert('Error al actualizar los roles');
        this.isLoading = false;
      }
    });
  }

  removeMember(member: ProjectMember): void {
    const memberName = member.userInfo?.username || member.userId;
    if (!confirm(`¿Estás seguro de remover a ${memberName} del proyecto?`)) {
      return;
    }

    this.isLoading = true;
    
    this.membersService.removeMember(member._id, this.currentUserId).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          alert('Miembro removido correctamente');
          this.loadMembers();
        } else {
          alert(response.strMessage || 'Error al remover miembro');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error removing member:', error);
        alert('Error al remover el miembro');
        this.isLoading = false;
      }
    });
  }

  close(): void {
    this.closeModal.emit();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
