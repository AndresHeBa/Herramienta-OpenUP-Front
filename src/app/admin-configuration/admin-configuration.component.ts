import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfigurationService } from '../service/configuration.service';
import { OpenUPConfiguration, Role, Phase, ArtifactType, Workflow, CustomField } from '../models/openup-configuration.model';
import { HasRoleDirective } from '../service/has-role.directive';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-admin-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HasRoleDirective],
  templateUrl: './admin-configuration.component.html',
  styleUrls: ['./admin-configuration.component.css']
})
export class AdminConfigurationComponent implements OnInit {
  configurations: OpenUPConfiguration[] = [];
  activeConfiguration: OpenUPConfiguration | null = null;
  selectedConfiguration: OpenUPConfiguration | null = null;
  configurationHistory: any[] = [];
  
  activeTab: 'roles' | 'phases' | 'artifacts' | 'workflows' | 'permissions' | 'history' = 'roles';
  
  // Forms
  roleForm!: FormGroup;
  phaseForm!: FormGroup;
  artifactTypeForm!: FormGroup;
  workflowForm!: FormGroup;
  configForm!: FormGroup;
  permissionsForm!: FormGroup;
  
  // Permissions data
  allActions: string[] = ['create', 'edit', 'approve', 'change_state', 'comment', 'review', 'delete', 'view'];
  
  // Modals
  showRoleModal = false;
  showPhaseModal = false;
  showArtifactModal = false;
  showWorkflowModal = false;
  showConfigModal = false;
  showApplyModal = false;
  showRevertModal = false;
  
  editMode = false;
  editingId: string | null = null;
  
  loading = false;
  message: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private configService: ConfigurationService,
    private authService: AuthService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadConfigurations();
    this.loadActiveConfiguration();
  }

  initForms(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      responsibilities: this.fb.array([]),
      active: [true]
    });

    this.phaseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      objectives: this.fb.array([]),
      order: [1, [Validators.required, Validators.min(1)]],
      active: [true]
    });

    this.artifactTypeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      phase: ['', Validators.required],
      required: [false],
      customFields: this.fb.array([]),
      active: [true]
    });

    this.workflowForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      phases: this.fb.array([]),
      steps: this.fb.array([]),
      active: [true]
    });

    this.configForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
    
    this.permissionsForm = this.fb.group({
      entries: this.fb.array([])
    });
  }

  // ==================== LOAD DATA ====================

  loadConfigurations(): void {
    this.loading = true;
    this.configService.getConfigurations().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.configurations = response.data;
          console.log('✅ Configurations loaded:', this.configurations);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading configurations:', error);
        this.showMessage('error', 'Error al cargar configuraciones');
        this.loading = false;
      }
    });
  }

  loadActiveConfiguration(): void {
    this.configService.getActiveConfiguration().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.activeConfiguration = response.data;
          this.selectedConfiguration = response.data;
          console.log('✅ Active configuration loaded:', this.activeConfiguration);
          
          // Load history for active configuration
          if (this.selectedConfiguration?._id) {
            this.loadConfigurationHistory(this.selectedConfiguration._id);
            this.buildPermissionsForm();
          }
        }
      },
      error: (error) => {
        console.error('❌ Error loading active configuration:', error);
      }
    });
  }

  selectConfiguration(config: OpenUPConfiguration): void {
    this.selectedConfiguration = config;
    this.loadConfigurationHistory(config._id!);
    this.buildPermissionsForm();
  }

  loadConfigurationHistory(configId: string): void {
    console.log('🔍 Loading history for config ID:', configId);
    this.configService.getConfigurationHistory(configId).subscribe({
      next: (response) => {
        console.log('📦 History response:', response);
        if (response && response.data) {
          this.configurationHistory = response.data;
          console.log('📜 Configuration history loaded:', this.configurationHistory);
        } else {
          console.log('⚠️ No history data in response');
          this.configurationHistory = [];
        }
      },
      error: (error) => {
        console.error('❌ Error loading history:', error);
        this.configurationHistory = [];
      }
    });
  }

  // ==================== ROLES ====================

  get responsibilities(): FormArray {
    return this.roleForm.get('responsibilities') as FormArray;
  }
  
  get permissionEntries(): FormArray {
    return this.permissionsForm.get('entries') as FormArray;
  }

  addResponsibility(): void {
    this.responsibilities.push(this.fb.control('', Validators.required));
  }

  removeResponsibility(index: number): void {
    this.responsibilities.removeAt(index);
  }

  openRoleModal(role?: Role): void {
    this.editMode = !!role;
    this.editingId = role?._id || null;
    
    if (role) {
      this.roleForm.patchValue({
        name: role.name,
        description: role.description,
        active: role.active
      });
      
      this.responsibilities.clear();
      role.responsibilities.forEach(resp => {
        this.responsibilities.push(this.fb.control(resp, Validators.required));
      });
    } else {
      this.roleForm.reset({ active: true });
      this.responsibilities.clear();
    }
    
    this.showRoleModal = true;
  }

  saveRole(): void {
    console.log('🔍 saveRole() called');
    console.log('Form valid:', this.roleForm.valid);
    console.log('Form value:', this.roleForm.value);
    console.log('Form errors:', this.roleForm.errors);
    console.log('Selected configuration:', this.selectedConfiguration);
    
    if (this.roleForm.invalid || !this.selectedConfiguration) {
      console.log('❌ Form invalid or no configuration selected');
      if (this.roleForm.invalid) {
        Object.keys(this.roleForm.controls).forEach(key => {
          const control = this.roleForm.get(key);
          if (control?.invalid) {
            console.log(`  Field ${key} is invalid:`, control.errors);
          }
        });
      }
      return;
    }

    const roleData = this.roleForm.value;
    const configId = this.selectedConfiguration._id!;

    console.log('✅ Proceeding to save role:', roleData);
    console.log('Config ID:', configId);
    console.log('Edit mode:', this.editMode);

    if (this.editMode && this.editingId) {
      this.configService.updateRole(configId, this.editingId, roleData).subscribe({
        next: () => {
          this.showMessage('success', 'Rol actualizado exitosamente');
          this.closeRoleModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error updating role:', error);
          this.showMessage('error', 'Error al actualizar rol');
        }
      });
    } else {
      this.configService.addRole(configId, roleData).subscribe({
        next: () => {
          this.showMessage('success', 'Rol creado exitosamente');
          this.closeRoleModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error creating role:', error);
          this.showMessage('error', 'Error al crear rol');
        }
      });
    }
  }

  deleteRole(roleId: string): void {
    if (!confirm('¿Está seguro de eliminar este rol?')) return;

    const configId = this.selectedConfiguration!._id!;
    this.configService.deleteRole(configId, roleId).subscribe({
      next: () => {
        this.showMessage('success', 'Rol eliminado exitosamente');
        this.loadConfigurations();
      },
      error: (error) => {
        console.error('❌ Error deleting role:', error);
        this.showMessage('error', 'Error al eliminar rol');
      }
    });
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.roleForm.reset({ active: true });
    this.responsibilities.clear();
  }

  // ==================== PHASES ====================

  get objectives(): FormArray {
    return this.phaseForm.get('objectives') as FormArray;
  }

  addObjective(): void {
    this.objectives.push(this.fb.control('', Validators.required));
  }

  removeObjective(index: number): void {
    this.objectives.removeAt(index);
  }

  openPhaseModal(phase?: Phase): void {
    this.editMode = !!phase;
    this.editingId = phase?._id || null;
    
    if (phase) {
      this.phaseForm.patchValue({
        name: phase.name,
        description: phase.description,
        order: phase.order,
        active: phase.active
      });
      
      this.objectives.clear();
      phase.objectives.forEach(obj => {
        this.objectives.push(this.fb.control(obj, Validators.required));
      });
    } else {
      this.phaseForm.reset({ active: true, order: 1 });
      this.objectives.clear();
    }
    
    this.showPhaseModal = true;
  }

  savePhase(): void {
    if (this.phaseForm.invalid || !this.selectedConfiguration) return;

    const phaseData = this.phaseForm.value;
    const configId = this.selectedConfiguration._id!;

    if (this.editMode && this.editingId) {
      this.configService.updatePhase(configId, this.editingId, phaseData).subscribe({
        next: () => {
          this.showMessage('success', 'Fase actualizada exitosamente');
          this.closePhaseModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error updating phase:', error);
          this.showMessage('error', 'Error al actualizar fase');
        }
      });
    } else {
      this.configService.addPhase(configId, phaseData).subscribe({
        next: () => {
          this.showMessage('success', 'Fase creada exitosamente');
          this.closePhaseModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error creating phase:', error);
          this.showMessage('error', 'Error al crear fase');
        }
      });
    }
  }

  deletePhase(phaseId: string): void {
    if (!confirm('¿Está seguro de eliminar esta fase?')) return;

    const configId = this.selectedConfiguration!._id!;
    this.configService.deletePhase(configId, phaseId).subscribe({
      next: () => {
        this.showMessage('success', 'Fase eliminada exitosamente');
        this.loadConfigurations();
      },
      error: (error) => {
        console.error('❌ Error deleting phase:', error);
        this.showMessage('error', 'Error al eliminar fase');
      }
    });
  }

  closePhaseModal(): void {
    this.showPhaseModal = false;
    this.phaseForm.reset({ active: true, order: 1 });
    this.objectives.clear();
  }

  // ==================== ARTIFACT TYPES ====================

  get customFields(): FormArray {
    return this.artifactTypeForm.get('customFields') as FormArray;
  }

  addCustomField(): void {
    const fieldGroup = this.fb.group({
      name: ['', Validators.required],
      type: ['text', Validators.required],
      required: [false],
      options: this.fb.array([]),
      defaultValue: ['']
    });
    this.customFields.push(fieldGroup);
  }

  removeCustomField(index: number): void {
    this.customFields.removeAt(index);
  }

  getFieldOptions(fieldIndex: number): FormArray {
    return this.customFields.at(fieldIndex).get('options') as FormArray;
  }

  addFieldOption(fieldIndex: number): void {
    const options = this.getFieldOptions(fieldIndex);
    options.push(this.fb.control('', Validators.required));
  }

  removeFieldOption(fieldIndex: number, optionIndex: number): void {
    const options = this.getFieldOptions(fieldIndex);
    options.removeAt(optionIndex);
  }

  openArtifactModal(artifact?: ArtifactType): void {
    this.editMode = !!artifact;
    this.editingId = artifact?._id || null;
    
    if (artifact) {
      this.artifactTypeForm.patchValue({
        name: artifact.name,
        description: artifact.description,
        phase: artifact.phase,
        required: artifact.required,
        active: artifact.active
      });
      
      this.customFields.clear();
      artifact.customFields?.forEach(field => {
        const fieldGroup = this.fb.group({
          name: [field.name, Validators.required],
          type: [field.type, Validators.required],
          required: [field.required],
          options: this.fb.array(field.options?.map(opt => this.fb.control(opt)) || []),
          defaultValue: [field.defaultValue]
        });
        this.customFields.push(fieldGroup);
      });
    } else {
      this.artifactTypeForm.reset({ active: true, required: false });
      this.customFields.clear();
    }
    
    this.showArtifactModal = true;
  }

  saveArtifactType(): void {
    if (this.artifactTypeForm.invalid || !this.selectedConfiguration) return;

    const artifactData = this.artifactTypeForm.value;
    const configId = this.selectedConfiguration._id!;

    if (this.editMode && this.editingId) {
      this.configService.updateArtifactType(configId, this.editingId, artifactData).subscribe({
        next: () => {
          this.showMessage('success', 'Tipo de artefacto actualizado exitosamente');
          this.closeArtifactModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error updating artifact type:', error);
          this.showMessage('error', 'Error al actualizar tipo de artefacto');
        }
      });
    } else {
      this.configService.addArtifactType(configId, artifactData).subscribe({
        next: () => {
          this.showMessage('success', 'Tipo de artefacto creado exitosamente');
          this.closeArtifactModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error creating artifact type:', error);
          this.showMessage('error', 'Error al crear tipo de artefacto');
        }
      });
    }
  }

  deleteArtifactType(artifactId: string): void {
    if (!confirm('¿Está seguro de eliminar este tipo de artefacto?')) return;

    const configId = this.selectedConfiguration!._id!;
    this.configService.deleteArtifactType(configId, artifactId).subscribe({
      next: () => {
        this.showMessage('success', 'Tipo de artefacto eliminado exitosamente');
        this.loadConfigurations();
      },
      error: (error) => {
        console.error('❌ Error deleting artifact type:', error);
        this.showMessage('error', 'Error al eliminar tipo de artefacto');
      }
    });
  }

  closeArtifactModal(): void {
    this.showArtifactModal = false;
    this.artifactTypeForm.reset({ active: true, required: false });
    this.customFields.clear();
  }

  // ==================== WORKFLOWS ====================

  openWorkflowModal(workflow?: Workflow): void {
    this.editMode = !!workflow;
    this.editingId = workflow?._id || null;

    this.workflowSteps.clear();

    if (workflow) {
      this.workflowForm.patchValue({
        name: workflow.name,
        description: workflow.description,
        active: workflow.active
      });

      workflow.steps?.forEach(step => {
        this.workflowSteps.push(this.fb.group({
          name: [step.name, Validators.required],
          order: [step.order, Validators.required],
          description: [step.description],
          responsibleRole: [step.responsibleRole]
        }));
      });
    } else {
      this.workflowForm.reset({ active: true });
    }

    this.showWorkflowModal = true;
  }

  addWorkflowStep(): void {
    const stepGroup = this.fb.group({
      name: ['', Validators.required],
      order: [this.workflowSteps.length + 1, Validators.required],
      description: [''],
      responsibleRole: ['']
    });
    this.workflowSteps.push(stepGroup);
  }

  removeWorkflowStep(index: number): void {
    this.workflowSteps.removeAt(index);
    // Update order numbers
    this.workflowSteps.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  get workflowSteps(): FormArray {
    return this.workflowForm.get('steps') as FormArray;
  }

  saveWorkflow(): void {
    if (this.workflowForm.invalid) return;

    const workflowData = this.workflowForm.value;

    if (this.editMode && this.editingId) {
      this.configService.updateWorkflow(this.selectedConfiguration!._id!, this.editingId, workflowData).subscribe({
        next: () => {
          this.showMessage('success', 'Flujo de trabajo actualizado');
          this.closeWorkflowModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error updating workflow:', error);
          this.showMessage('error', 'Error al actualizar flujo de trabajo');
        }
      });
    } else {
      this.configService.addWorkflow(this.selectedConfiguration!._id!, workflowData).subscribe({
        next: () => {
          this.showMessage('success', 'Flujo de trabajo agregado');
          this.closeWorkflowModal();
          this.loadConfigurations();
        },
        error: (error) => {
          console.error('❌ Error adding workflow:', error);
          this.showMessage('error', 'Error al agregar flujo de trabajo');
        }
      });
    }
  }

  deleteWorkflow(workflowId: string): void {
    if (!confirm('¿Está seguro de eliminar este flujo de trabajo?')) return;

    this.configService.deleteWorkflow(this.selectedConfiguration!._id!, workflowId).subscribe({
      next: () => {
        this.showMessage('success', 'Flujo de trabajo eliminado');
        this.loadConfigurations();
      },
      error: (error) => {
        console.error('❌ Error deleting workflow:', error);
        this.showMessage('error', 'Error al eliminar flujo de trabajo');
      }
    });
  }

  closeWorkflowModal(): void {
    this.showWorkflowModal = false;
    this.workflowForm.reset({ active: true });
    this.workflowSteps.clear();
  }

  // ==================== CONFIGURATION ====================

  createNewConfiguration(): void {
    console.log('🆕 Opening new configuration modal');
    console.log('Form before reset:', this.configForm);
    this.configForm.reset();
    console.log('Form after reset:', this.configForm.value);
    this.showConfigModal = true;
    console.log('Modal state:', this.showConfigModal);
    
    // Force change detection
    setTimeout(() => {
      console.log('Checking DOM for modal...', document.querySelector('.modal'));
    }, 100);
  }

  saveConfiguration(): void {
    if (this.configForm.invalid) return;

    const currentUser = this.authService.getCurrentUser();
    const configData = {
      ...this.configForm.value,
      createdBy: currentUser?.username || 'admin',
      roles: [],
      phases: [],
      artifactTypes: [],
      workflows: [],
      active: false
    };

    this.loading = true;
    this.configService.createConfiguration(configData).subscribe({
      next: (response) => {
        console.log('✅ Configuration created:', response);
        this.showMessage('success', 'Configuración creada exitosamente');
        this.closeConfigModal();
        this.loadConfigurations();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error creating configuration:', error);
        this.showMessage('error', 'Error al crear configuración: ' + (error.error?.strMessage || error.message));
        this.loading = false;
      }
    });
  }

  setAsActive(configId: string): void {
    if (!confirm('¿Está seguro de establecer esta configuración como activa? Esto afectará a todos los nuevos proyectos.')) return;

    this.configService.setActiveConfiguration(configId).subscribe({
      next: () => {
        this.showMessage('success', 'Configuración establecida como activa');
        this.loadActiveConfiguration();
        this.loadConfigurations();
      },
      error: (error) => {
        console.error('❌ Error setting active configuration:', error);
        this.showMessage('error', 'Error al establecer configuración activa');
      }
    });
  }

  closeConfigModal(): void {
    this.showConfigModal = false;
    this.configForm.reset();
  }

  // ==================== APPLY TO PROJECTS ====================

  openApplyModal(): void {
    this.showApplyModal = true;
  }

  applyToAllProjects(): void {
    if (!confirm('¿Está seguro de aplicar esta configuración a TODOS los proyectos existentes? Esta acción puede afectar el funcionamiento de proyectos en curso.')) return;

    const configId = this.selectedConfiguration!._id!;
    this.configService.applyConfigurationToAllProjects(configId).subscribe({
      next: () => {
        this.showMessage('success', 'Configuración aplicada a todos los proyectos');
        this.showApplyModal = false;
      },
      error: (error) => {
        console.error('❌ Error applying configuration:', error);
        this.showMessage('error', 'Error al aplicar configuración');
      }
    });
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  // ==================== PERMISSIONS ====================
  
  buildPermissionsForm(): void {
    if (!this.selectedConfiguration) return;
    
    this.permissionEntries.clear();
    
    for (const action of this.allActions) {
      const existingPerm = this.selectedConfiguration.permissions?.find(p => p.action === action);
      const group = this.fb.group({
        action: [action],
        roles: [existingPerm?.roles || []]
      });
      this.permissionEntries.push(group);
    }
  }
  
  togglePermissionRole(entryIndex: number, roleName: string): void {
    const control = this.permissionEntries.at(entryIndex);
    const current: string[] = control.value.roles || [];
    const idx = current.indexOf(roleName);
    
    if (idx === -1) {
      current.push(roleName);
    } else {
      current.splice(idx, 1);
    }
    
    control.patchValue({ roles: [...current] });
  }
  
  savePermissions(): void {
    if (!this.selectedConfiguration) return;
    
    const permissions = this.permissionEntries.controls.map(c => ({
      action: c.value.action,
      roles: c.value.roles || []
    }));
    
    this.loading = true;
    this.configService.updatePermissions(this.selectedConfiguration._id!, permissions).subscribe({
      next: () => {
        this.showMessage('success', 'Permisos actualizados exitosamente');
        this.loadConfigurations();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error updating permissions:', error);
        this.showMessage('error', 'Error al actualizar permisos');
        this.loading = false;
      }
    });
  }
  
  getAssignedRoleNames(roleNames: string[]): string {
    if (!roleNames || roleNames.length === 0) return '—';
    
    const names = roleNames.map(rn => {
      const role = this.selectedConfiguration?.roles.find(r => r.name === rn);
      return role?.name || rn;
    });
    
    return names.join(', ');
  }

  // ==================== REVERT ====================

  openRevertModal(): void {
    this.showRevertModal = true;
  }

  revertToVersion(version: number): void {
    if (!confirm(`¿Está seguro de revertir a la versión ${version}? Los cambios actuales se perderán.`)) return;

    const configId = this.selectedConfiguration!._id!;
    this.configService.revertToVersion(configId, version).subscribe({
      next: () => {
        this.showMessage('success', `Configuración revertida a versión ${version}`);
        this.showRevertModal = false;
        this.loadConfigurations();
      },
      error: (error) => {
        console.error('❌ Error reverting configuration:', error);
        this.showMessage('error', 'Error al revertir configuración');
      }
    });
  }

  closeRevertModal(): void {
    this.showRevertModal = false;
  }

  // ==================== UTILS ====================

  showMessage(type: 'success' | 'error', text: string): void {
    this.message = { type, text };
    setTimeout(() => {
      this.message = null;
    }, 5000);
  }
}
