import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MainService } from '../service/main.service';
import { ConfigurationService } from '../service/configuration.service';
import { ExportImportService } from '../service/export-import.service';
import { ActiveProjectService } from '../service/active-project.service';
import { Router } from '@angular/router';
import { ProjectPlan } from '../models/project-plan.model';
import { ProgressComponent } from '../progress/progress.component';
import { IterationModalComponent } from '../iteration-modal/iteration-modal.component';
import { HistoryModalComponent } from '../history-modal/history-modal.component';
import { MicroincrementModalComponent } from '../microincrement-modal/microincrement-modal.component';
import { Iteration } from '../models/iteration.model';
import { HasPermissionDirective } from '../service/has-permission.directive';
import { HasRoleDirective } from '../service/has-role.directive';
import { OpenUPConfiguration } from '../models/openup-configuration.model';
import { AuditViewerComponent } from '../audit-viewer/audit-viewer.component';
import { ProjectMembersComponent } from '../project-members/project-members.component';
import { ProjectClosureModalComponent } from '../project-closure-modal/project-closure-modal.component';
import { ProjectClosureService } from '../service/project-closure.service';

interface Fase {
  name: string;
  status: string;
  plan?: ProjectPlan;
}

interface Proyecto {
  _id: string;
  name: string;
  identifier: string;
  startDate: string;
  responsible: string;
  description: string;
  tags: string;
  active: boolean;
  status: string;
  phases: Fase[];
  iterations?: Iteration[];
}

@Component({
  selector: 'app-ventana-creacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ProgressComponent, IterationModalComponent, HistoryModalComponent, MicroincrementModalComponent, HasPermissionDirective, HasRoleDirective, AuditViewerComponent, ProjectMembersComponent, ProjectClosureModalComponent],
  templateUrl: './ventana-creacion.component.html',
  styleUrl: './ventana-creacion.component.css'
})
export class VentanaCreacionComponent implements OnInit {
  proyectos: Proyecto[] = [];
  mostrarFormulario = false;
  editandoId: string | null = null;
  detalleProyecto: Proyecto | null = null;
  mostrarDetalle = false;

  projectPlanForm!: FormGroup;
  mostrandoFormularioPlan = false;
  faseActualParaPlan: Fase | null = null;

  // Variables para iteraciones
  mostrarIterationModal: boolean = false;
  selectedIteration: Iteration | any = null;
  iteraciones: Iteration[] = [];

  mostrarHistoryModal = false;

  mostrarMicroincrementModal = false;
  selectedProjectIdForMicroincrement: string | null = null;

  // HU-024: Audit viewer state
  mostrarAuditModal = false;
  selectedProjectIdForAudit: string | null = null;

  // HU-025: Project members state
  mostrarMembersModal = false;
  selectedProjectIdForMembers: string | null = null;

  // HU-026: Project closure state
  mostrarClosureModal = false;
  selectedProjectIdForClosure: string | null = null;
  selectedProjectNameForClosure: string = '';

  // Configuration
  configurations: OpenUPConfiguration[] = [];
  selectedConfigurationId: string | null = null;
  currentProjectConfiguration: OpenUPConfiguration | null = null;

  // HU-023: Export/Import state
  showImportModal = false;
  selectedImportFile: File | null = null;
  importFileName = '';
  isImporting = false;
  importError = '';
  importSuccess = '';

  constructor(
    private mainService: MainService,
    private configService: ConfigurationService,
    private exportImportService: ExportImportService,
    private closureService: ProjectClosureService,
    private fb: FormBuilder,
    public activeProject: ActiveProjectService,
    private router: Router
  ) { }

  formData = {
    nombre: '',
    identificador: '',
    fechaInicio: '',
    responsable: '',
    descripcion: '',
    tags: '',
    repositoryUrl: ''
  };

  fasesPredeterminadas = [
    { nombre: 'Incepción', estado: 'Pendiente' },
    { nombre: 'Elaboración', estado: 'Pendiente' },
    { nombre: 'Construcción', estado: 'Pendiente' },
    { nombre: 'Transición', estado: 'Pendiente' }
  ];

  loadConfigurations(): void {
    this.configService.getConfigurations().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.configurations = response.data;
          console.log('✅ Configurations loaded:', this.configurations);
          
          // Pre-select active configuration if available
          const activeConfig = this.configurations.find(c => c.active);
          if (activeConfig) {
            this.selectedConfigurationId = activeConfig._id || null;
          }
        }
      },
      error: (error) => {
        console.error('❌ Error loading configurations:', error);
      }
    });
  }

  getSelectedConfigurationPhases(): string[] {
    if (!this.selectedConfigurationId) {
      return this.fasesPredeterminadas.map(f => f.nombre);
    }

    const config = this.configurations.find(c => c._id === this.selectedConfigurationId);
    if (!config || !config.phases || config.phases.length === 0) {
      return this.fasesPredeterminadas.map(f => f.nombre);
    }

    // Sort phases by order and return their names
    return config.phases
      .sort((a, b) => a.order - b.order)
      .map(phase => phase.name);
  }

  ngOnInit() {
    this.loadConfigurations();
    this.cargarProyectos();

    this.projectPlanForm = this.fb.group({
      objetivos: ['', Validators.required],
      alcance: ['', Validators.required],
      cronogramaInicial: ['', Validators.required],
      responsabilidades: ['', Validators.required],
      observaciones: ['']
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
  }

  crearProyecto() {
    if (!this.formData.nombre || !this.formData.identificador || !this.formData.fechaInicio) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    // Get phases from selected configuration
    const phasesFromConfig = this.getSelectedConfigurationPhases();

    const nuevoProyecto: Proyecto = {
      _id: Date.now().toString(),
      name: this.formData.nombre,
      identifier: this.formData.identificador,
      startDate: this.formData.fechaInicio,
      responsible: this.formData.responsable,
      description: this.formData.descripcion,
      tags: this.formData.tags,
      status: 'Creado',
      active: true,
      phases: phasesFromConfig.map(phaseName => ({ name: phaseName, status: 'Pendiente' }))
    };

    this.mainService.postproyect(
      nuevoProyecto.name,
      nuevoProyecto.identifier,
      nuevoProyecto.startDate,
      nuevoProyecto.description,
      nuevoProyecto.responsible,
      nuevoProyecto.tags.split(',').map(tag => tag.trim()),
      phasesFromConfig,
      this.selectedConfigurationId,
      nuevoProyecto.active,
      this.formData.repositoryUrl || undefined
    ).subscribe({
      next: (response) => {
        console.log('Proyecto creado en la API:', response);
      },
      error: (error) => {
        console.error('Error al crear el proyecto en la API:', error);
      }
    });

    console.log('Creando proyecto:', nuevoProyecto);
    this.proyectos.push(nuevoProyecto);
    this.guardarProyectos();
    this.limpiarFormulario();
    this.mostrarFormulario = false;
  }

  guardarProyecto() {
    if (this.editandoId) {
      // Actualizar proyecto existente
      const tagsArray = typeof this.formData.tags === 'string' 
        ? this.formData.tags.split(',').map(tag => tag.trim())
        : this.formData.tags;
      
      this.mainService.updateProject(
        this.editandoId,
        this.formData.nombre,
        this.formData.identificador,
        this.formData.fechaInicio,
        this.formData.descripcion,
        this.formData.responsable,
        tagsArray,
        this.formData.repositoryUrl || undefined
      ).subscribe({
        next: (response) => {
          console.log('Proyecto actualizado en la API:', response);
          // Actualizar lista local
          const index = this.proyectos.findIndex(p => p._id === this.editandoId);
          if (index !== -1) {
            this.proyectos[index] = {
              ...this.proyectos[index],
              name: this.formData.nombre,
              identifier: this.formData.identificador,
              startDate: this.formData.fechaInicio,
              responsible: this.formData.responsable,
              description: this.formData.descripcion,
              tags: this.formData.tags
            };
          }
          this.editandoId = null;
          this.limpiarFormulario();
          this.mostrarFormulario = false;
          alert('Proyecto actualizado correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar el proyecto en la API:', error);
          alert('Error al actualizar el proyecto');
        }
      });
    } else {
      this.crearProyecto();
    }
  }

  editarProyecto(id: string) {
    const proyecto = this.proyectos.find(p => p._id === id);
    if (proyecto) {
      this.formData = {
        nombre: proyecto.name,
        identificador: proyecto.identifier,
        fechaInicio: proyecto.startDate,
        responsable: proyecto.responsible,
        descripcion: proyecto.description,
        tags: proyecto.tags,
        repositoryUrl: (proyecto as any).repositoryUrl || ''
      };
      this.editandoId = id;
      this.mostrarFormulario = true;
    }
  }

  verDetalles(id: string) {
    this.detalleProyecto = this.proyectos.find(p => p._id === id) || null;
    this.mostrarDetalle = true;
    console.log(this.detalleProyecto)

    // Scroll automático a la sección de detalles
    setTimeout(() => {
      const detalleSection = document.querySelector('.detalle-section');
      if (detalleSection) {
        detalleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Cargar iteraciones cuando se abre el detalle
    if (this.detalleProyecto) {
      this.loadIterations();
      this.loadPlan(id);
      
      // Load and set the project's configuration as active
      this.loadProjectConfiguration(id);
    }
  }

  loadProjectConfiguration(projectId: string): void {
    this.configService.getProjectConfiguration(projectId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.currentProjectConfiguration = response.data;
          console.log('✅ Project configuration loaded:', this.currentProjectConfiguration);
          
          // If this project has a specific configuration, set it as active temporarily
          if (this.currentProjectConfiguration?._id) {
            this.configService.setActiveConfiguration(this.currentProjectConfiguration._id).subscribe({
              next: () => {
                console.log('✅ Configuration set as active for project context');
              },
              error: (error) => {
                console.error('❌ Error setting project configuration as active:', error);
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('❌ Error loading project configuration:', error);
        this.currentProjectConfiguration = null;
      }
    });
  }

  loadPlan(projectId: string) {
    this.mainService.getPlan(projectId).subscribe({
      next: (response) => {
        console.log('Plan cargado:', response);
        if (response.intCode === 200 && response.data) {
          // Buscar la fase de Incepción y asignar el plan
          const inceptionPhase = this.detalleProyecto?.phases.find(p => p.name === 'Incepción');
          if (inceptionPhase) {
            inceptionPhase.plan = {
              objetivos: response.data.objectives,
              alcance: response.data.scope,
              cronogramaInicial: response.data.initialSchedule,
              responsabilidades: response.data.phaseResponsibles,
              observaciones: response.data.observations,
              version: parseInt(response.data.version) || 1,
              fecha: new Date(response.data.createdAt || Date.now()),
              fase: 'Incepción'
            };
          }
        }
      },
      error: (error) => {
        console.log('No se encontró plan o error al cargar:', error);
      }
    });
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.detalleProyecto = null;
    this.iteraciones = [];
    this.currentProjectConfiguration = null;
    this.cancelarCreacionPlan();
  }

  openArtifacts(projectIdentifier: string) {
    this.activeProject.setActiveProject(projectIdentifier);
    this.cerrarDetalle();
    this.router.navigate(['/artifacts', projectIdentifier]);
  }

  eliminarProyecto(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      this.proyectos = this.proyectos.filter(p => p._id !== id);
      this.guardarProyectos();
    }
  }

  getTagsArray(tags: string | null | undefined): string[] {
    if (!tags || typeof tags !== 'string') {
      return [];
    }
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  archivarProyecto(id: string) {
    if (confirm('¿Estás seguro de que deseas archivar este proyecto?')) {
      this.mainService.deactivateProject(id).subscribe({
        next: (response) => {
          console.log('Proyecto archivado en la API:', response);
          const proyecto = this.proyectos.find(p => p._id === id);
          if (proyecto) {
            proyecto.active = false;
            proyecto.status = 'Archivado';
            this.guardarProyectos();
          }
        },
        error: (error) => {
          console.error('Error al archivar el proyecto en la API:', error);
          alert('Error al archivar el proyecto');
        }
      });
    }
  }

  iniciarCreacionPlan(fase: Fase) {
    this.faseActualParaPlan = fase;
    this.mostrandoFormularioPlan = true;
    this.projectPlanForm.reset();
  }

  cancelarCreacionPlan() {
    this.mostrandoFormularioPlan = false;
    this.faseActualParaPlan = null;
  }

  guardarPlan() {
    if (this.projectPlanForm.invalid || !this.faseActualParaPlan || !this.detalleProyecto) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const formValues = this.projectPlanForm.value;

    // Enviar al backend
    this.mainService.postPlan(
      this.detalleProyecto._id,
      formValues.objetivos,
      formValues.alcance,
      formValues.cronogramaInicial, // initialSchedule
      formValues.responsabilidades, // phaseResponsibles
      [], // milestones vacío por ahora
      formValues.observaciones || '',
      '1' // version
    ).subscribe({
      next: (response) => {
        console.log('Plan creado en el backend:', response);
        
        // Actualizar localmente
        const nuevoPlan: ProjectPlan = {
          objetivos: formValues.objetivos,
          alcance: formValues.alcance,
          cronogramaInicial: formValues.cronogramaInicial,
          responsabilidades: formValues.responsabilidades,
          observaciones: formValues.observaciones || '',
          version: 1,
          fecha: new Date(),
          fase: this.faseActualParaPlan!.name,
        };

        this.faseActualParaPlan!.plan = nuevoPlan;
        alert('Plan guardado exitosamente');
        this.cancelarCreacionPlan();
        
        // Recargar proyecto para obtener datos actualizados
        if (this.detalleProyecto) {
          this.verDetalles(this.detalleProyecto._id);
        }
      },
      error: (error) => {
        console.error('Error al guardar el plan:', error);
        alert('Error al guardar el plan en el servidor');
      }
    });
  }

  // ==================== MÉTODOS DE ITERACIONES ====================

  // Cargar todas las iteraciones del proyecto
  loadIterations() {
    if (!this.detalleProyecto?._id) return;

    this.mainService.getIteraciones(this.detalleProyecto._id).subscribe({
      next: (response) => {
        this.iteraciones = Array.isArray(response.data) ? response.data : [];
        console.log(response.data)
      },
      error: (err) => {
        console.error('Error cargando iteraciones', err);
        this.iteraciones = [];
      }
    });
  }

  // Abrir modal para CREAR nueva iteración
  openCreateIterationModal() {
    console.log(this.mostrarIterationModal);
    this.selectedIteration = null;
    this.mostrarIterationModal = true;
  }

  // Abrir modal para EDITAR iteración existente
  openEditIterationModal(iteration: Iteration) {
    this.selectedIteration = { ...iteration }; // Clonar para evitar mutación directa
    this.mostrarIterationModal = true;
  }

  openIterationModal(iteration: Iteration | null) {
    this.selectedIteration = iteration;
    this.mostrarIterationModal = true;
  }

  // Cerrar modal y recargar datos si es necesario
  closeIterationModal(reloadData: boolean) {
    this.mostrarIterationModal = false;
    this.selectedIteration = null;

    if (reloadData) {
      // Recargar las iteraciones después de crear/actualizar
      this.loadIterations();
    }
  }

  // Eliminar iteración
  deleteIteration(iteration: Iteration) {
    if (!this.detalleProyecto?._id) return;

    if (!confirm(`¿Estás seguro de eliminar la iteración "${iteration.iteration}"?`)) {
      return;
    }

    this.mainService.deleteIteracion(this.detalleProyecto._id, iteration.iteration).subscribe({
      next: (response) => {
        console.log('Iteración eliminada', response);
        this.loadIterations(); // Recargar lista
      },
      error: (err) => {
        console.error('Error eliminando iteración', err);
        alert('Error al eliminar la iteración');
      }
    });
  }

  // Actualizar solo el progreso de tareas (opcional, para checkboxes rápidos)
  updateTaskProgress(iteration: Iteration, tasks: any[]) {
    if (!this.detalleProyecto?._id) return;

    this.mainService.updateIterationProgress(
      this.detalleProyecto._id,
      iteration.iteration,
      tasks
    ).subscribe({
      next: () => {
        console.log('Progreso actualizado');
        this.loadIterations();
      },
      error: (err) => console.error('Error actualizando progreso', err)
    });
  }

  // ==================== FIN MÉTODOS DE ITERACIONES ====================

  openHistoryModal() {
    this.mostrarHistoryModal = true;
  }

  closeHistoryModal() {
    this.mostrarHistoryModal = false;
  }

  openMicroincrementModal(projectId: string) {
    console.log('Opening microincrement modal for project:', projectId);
    this.selectedProjectIdForMicroincrement = projectId;
    this.mostrarMicroincrementModal = true;
    console.log('Modal state:', this.mostrarMicroincrementModal, this.selectedProjectIdForMicroincrement);
  }

  closeMicroincrementModal(refresh: boolean) {
    this.mostrarMicroincrementModal = false;
    this.selectedProjectIdForMicroincrement = null;
    if (refresh) {
      // Potentially refresh data here if needed
    }
  }

  // HU-024: Audit modal methods
  openAuditModal(projectId: string) {
    console.log('Opening audit modal for project:', projectId);
    this.selectedProjectIdForAudit = projectId;
    this.mostrarAuditModal = true;
  }

  closeAuditModal() {
    this.mostrarAuditModal = false;
    this.selectedProjectIdForAudit = null;
  }

  // HU-025: Project members modal methods
  openMembersModal(projectId: string) {
    console.log('Opening members modal for project:', projectId);
    this.selectedProjectIdForMembers = projectId;
    this.mostrarMembersModal = true;
  }

  closeMembersModal() {
    this.mostrarMembersModal = false;
    this.selectedProjectIdForMembers = null;
  }

  // HU-026: Project closure modal methods
  openClosureModal(projectId: string, projectName: string) {
    console.log('Opening closure modal for project:', projectId);
    this.selectedProjectIdForClosure = projectId;
    this.selectedProjectNameForClosure = projectName;
    this.mostrarClosureModal = true;
  }

  closeClosureModal(projectClosed: boolean) {
    this.mostrarClosureModal = false;
    this.selectedProjectIdForClosure = null;
    this.selectedProjectNameForClosure = '';
    
    if (projectClosed) {
      // Recargar lista de proyectos para reflejar el cambio de estado
      this.cargarProyectos();
      // Cerrar el detalle si está abierto
      this.cerrarDetalle();
    }
  }

  downloadClosurePDF(projectId: string) {
    this.closureService.downloadClosurePDF(projectId);
  }

  private guardarProyectos() {
    localStorage.setItem('proyectos', JSON.stringify(this.proyectos));
  }

  private limpiarFormulario() {
    this.formData = {
      nombre: '',
      identificador: '',
      fechaInicio: '',
      responsable: '',
      descripcion: '',
      tags: '',
      repositoryUrl: ''
    };
  }

  // ==================== HU-023: EXPORT/IMPORT FUNCTIONALITY ====================

  /**
   * Load all projects from backend
   */
  cargarProyectos() {
    this.mainService.getProjects().subscribe({
      next: (response: any) => {
        console.log('Proyectos leidos', response.Result.listResult);
        this.proyectos = response.Result.listResult;
      },
      error: (err) => {
        console.log('Error al traer proyectos', err);
      },
    });
  }

  /**
   * Export project as ZIP with all data and files
   */
  exportProject(projectId: string) {
    const project = this.proyectos.find(p => p._id === projectId);
    if (!project) {
      alert('Proyecto no encontrado');
      return;
    }

    const confirmMsg = `¿Exportar el proyecto "${project.name}"?\n\nSe descargará un archivo ZIP con todos los artefactos, metadatos e historial.`;
    if (!confirm(confirmMsg)) return;

    this.exportImportService.exportProject(projectId, 'zip', true).subscribe({
      next: (response) => {
        if (response.body) {
          // Extract filename from Content-Disposition header or use default
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `export_${project.identifier}_${new Date().getTime()}.zip`;
          
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }

          this.exportImportService.downloadBlob(response.body, filename);
          alert(`✓ Proyecto exportado exitosamente: ${filename}`);
        }
      },
      error: (err) => {
        console.error('Error exporting project:', err);
        alert('Error al exportar el proyecto');
      }
    });
  }

  /**
   * Open import modal
   */
  openImportModal() {
    this.showImportModal = true;
    this.selectedImportFile = null;
    this.importFileName = '';
    this.importError = '';
    this.importSuccess = '';
  }

  /**
   * Close import modal
   */
  closeImportModal() {
    this.showImportModal = false;
    this.selectedImportFile = null;
    this.importFileName = '';
    this.importError = '';
    this.importSuccess = '';
  }

  /**
   * Handle import file selection
   */
  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.name.endsWith('.json')) {
        this.importError = 'Por favor selecciona un archivo JSON válido';
        this.selectedImportFile = null;
        this.importFileName = '';
        return;
      }

      this.selectedImportFile = file;
      this.importFileName = file.name;
      this.importError = '';
      this.importSuccess = '';
    }
  }

  /**
   * Perform project import from selected file
   */
  performImport() {
    if (!this.selectedImportFile) {
      this.importError = 'Por favor selecciona un archivo primero';
      return;
    }

    this.isImporting = true;
    this.importError = '';
    this.importSuccess = '';

    this.exportImportService.importProjectFromFile(this.selectedImportFile).subscribe({
      next: (response) => {
        this.isImporting = false;
        
        if (response && response.intCode === 200) {
          const result = response.Result;
          this.importSuccess = `Proyecto importado exitosamente: ${result.identifier}`;
          
          // Refresh project list
          this.cargarProyectos();
          
          // Close modal after a delay
          setTimeout(() => {
            this.closeImportModal();
          }, 2000);
        } else {
          this.importError = response?.data || 'Error al importar el proyecto';
        }
      },
      error: (err) => {
        this.isImporting = false;
        this.importError = err?.error?.data || 'Error al importar el proyecto';
        console.error('Import error:', err);
      }
    });
  }
}
