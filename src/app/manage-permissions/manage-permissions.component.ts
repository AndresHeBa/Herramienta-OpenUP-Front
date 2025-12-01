import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../service/permissions.service';

@Component({
  selector: 'app-manage-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-permissions.component.html',
  styleUrls: ['./manage-permissions.component.css']
})
export class ManagePermissionsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  permissions: Array<any> = [];
  roles: Array<any> = [];
  actions: string[] = ['create','edit','approve','change_state','comment','review'];

  // Fallback defaults
  private readonly DEFAULT_ROLES = [
    { name: 'author', displayName: 'Autor' },
    { name: 'revisor', displayName: 'Revisor' },
    { name: 'PO', displayName: 'Product Owner' },
    { name: 'admin', displayName: 'Administrador' }
  ];
  private readonly DEFAULT_PERMISSIONS = [
    { action: 'create', roles: ['author','admin'] },
    { action: 'edit', roles: ['author','admin'] },
    { action: 'approve', roles: ['revisor','PO','admin'] },
    { action: 'change_state', roles: ['revisor','PO','admin'] },
    { action: 'comment', roles: ['author','revisor','PO','admin'] },
    { action: 'review', roles: ['revisor','admin'] }
  ];

  // Formulario para crear rol
  newRole = { name: '', displayName: '', description: '' };
  creatingRole = false;
  roleCreationError: string | null = null;

  // Edición de rol existente
  editingRoleName: string | null = null;
  editingRole: { displayName: string; description: string } = { displayName: '', description: '' };
  roleEditError: string | null = null;

  form: FormGroup;

  constructor(private ps: PermissionsService, private fb: FormBuilder) {
    this.form = this.fb.group({
      entries: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  get entries(): FormArray { return this.form.get('entries') as FormArray; }

  private buildFormEntries() {
    this.entries.clear();
    for (const a of this.actions) {
      const p = this.permissions.find((x:any) => x.action === a) || { action: a, roles: [] };
      const group = this.fb.group({ action: a, roles: [p.roles || []] });
      this.entries.push(group);
    }
  }

  loadRoles() {
    this.ps.getRoles().subscribe(res => {
      if (res && Array.isArray(res.data) && res.data.length) {
        this.roles = res.data;
      } else {
        this.roles = this.DEFAULT_ROLES;
      }
    }, err => { this.error = 'No se pudieron cargar roles'; });
  }

  startCreateRole() {
    this.creatingRole = true;
    this.newRole = { name: '', displayName: '', description: '' };
    this.roleCreationError = null;
  }

  cancelCreateRole() {
    this.creatingRole = false;
    this.roleCreationError = null;
  }

  submitCreateRole() {
    const { name, displayName } = this.newRole;
    if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
      this.roleCreationError = 'Nombre de rol inválido (solo letras, números, guion y guion_bajo).';
      return;
    }
    this.roleCreationError = null;
    this.ps.createRole(this.newRole).subscribe(res => {
      // backend retorna data en res.data; recargar lista roles
      this.loadRoles();
      this.creatingRole = false;
    }, err => {
      this.roleCreationError = 'Error al crear rol';
    });
  }

  startEditRole(role: any) {
    this.editingRoleName = role?.name || null;
    this.editingRole = { displayName: role?.displayName || '', description: role?.description || '' };
    this.roleEditError = null;
  }

  cancelEditRole() {
    this.editingRoleName = null;
    this.roleEditError = null;
  }

  submitEditRole() {
    if (!this.editingRoleName) return;
    const payload = { displayName: this.editingRole.displayName, description: this.editingRole.description };
    this.ps.updateRole(this.editingRoleName, payload).subscribe(res => {
      this.loadRoles();
      this.editingRoleName = null;
    }, err => {
      this.roleEditError = 'Error al actualizar rol';
    });
  }

  loadPermissions() {
    this.loading = true;
    this.ps.getPermissions().subscribe(res => {
      this.loading = false;
      if (res && Array.isArray(res.data) && res.data.length) {
        this.permissions = res.data;
      } else {
        this.permissions = this.DEFAULT_PERMISSIONS;
      }
      this.buildFormEntries();
    }, err => { this.loading = false; this.error = 'No se pudieron cargar permisos'; this.permissions = this.DEFAULT_PERMISSIONS; this.buildFormEntries(); });
  }

  saveAll() {
    const data = this.entries.controls.map(c => ({ action: c.value.action, roles: c.value.roles || [] }));
    this.loading = true;
    this.ps.replacePermissions(data).subscribe(res => {
      this.loading = false;
      this.permissions = data;
    }, err => { this.loading = false; this.error = 'Error al guardar permisos'; });
  }

  toggleRole(entryIndex: number, roleName: string) {
    const control = this.entries.at(entryIndex);
    const current: string[] = control.value.roles || [];
    const idx = current.indexOf(roleName);
    if (idx === -1) current.push(roleName); else current.splice(idx,1);
    control.patchValue({ roles: current });
  }

  assignedNames(roleNames: string[] | null | undefined): string {
    const names = (roleNames || []).map(rn => {
      const found = this.roles.find((rr: any) => rr.name === rn);
      return (found && (found.displayName || found.name)) || rn;
    });
    return names.length ? names.join(', ') : '—';
  }

}
