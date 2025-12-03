import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MainService } from '../service/main.service';
import { ActiveProjectService } from '../service/active-project.service';
import { Router } from '@angular/router';
import { ProjectPlan } from '../models/project-plan.model';
import { ProgressComponent } from '../progress/progress.component';
import { IterationModalComponent } from '../iteration-modal/iteration-modal.component';
import { HistoryModalComponent } from '../history-modal/history-modal.component';
import { MicroincrementModalComponent } from '../microincrement-modal/microincrement-modal.component';
import { Iteration } from '../models/iteration.model';

interface Fase {
  name: string;
  status: string;
  plan?: ProjectPlan;
}

interface Proyecto {
  _id: string;
  name: string;
  identificador: string;
  fechaInicio: string;
  responsable: string;
  descripcion: string;
  tags: string;
  activo: boolean;
  estado: string;
  phases: Fase[];
  iterations?: Iteration[];
}

@Component({
  selector: 'app-ventana-creacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ProgressComponent, IterationModalComponent, HistoryModalComponent, MicroincrementModalComponent],
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

  constructor(
    private mainService: MainService,
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
    tags: ''
  };

  fasesPredeterminadas = [
    { nombre: 'Incepción', estado: 'Pendiente' },
    { nombre: 'Elaboración', estado: 'Pendiente' },
    { nombre: 'Construcción', estado: 'Pendiente' },
    { nombre: 'Transición', estado: 'Pendiente' }
  ];

  ngOnInit() {
    this.mainService.getProjects().subscribe({
      next: (response: any) => {
        console.log('Proyectos leidos', response.Result.listResult);
        this.proyectos = response.Result.listResult;
      },
      error: (err) => {
        console.log('Error al traer proyectos', err);
      },
    });

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

    const nuevoProyecto: Proyecto = {
      _id: Date.now().toString(),
      name: this.formData.nombre,
      identificador: this.formData.identificador,
      fechaInicio: this.formData.fechaInicio,
      responsable: this.formData.responsable,
      descripcion: this.formData.descripcion,
      tags: this.formData.tags,
      estado: 'Creado',
      activo: true,
      phases: JSON.parse(JSON.stringify(this.fasesPredeterminadas))
    };

    this.mainService.postproyect(
      nuevoProyecto.name,
      nuevoProyecto.identificador,
      nuevoProyecto.fechaInicio,
      nuevoProyecto.descripcion,
      nuevoProyecto.responsable,
      nuevoProyecto.tags.split(',').map(tag => tag.trim()),
      nuevoProyecto.activo
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
      const index = this.proyectos.findIndex(p => p._id === this.editandoId);
      if (index !== -1) {
        this.proyectos[index] = {
          ...this.proyectos[index],
          name: this.formData.nombre,
          identificador: this.formData.identificador,
          fechaInicio: this.formData.fechaInicio,
          responsable: this.formData.responsable,
          descripcion: this.formData.descripcion,
          tags: this.formData.tags
        };
        this.guardarProyectos();
        this.editandoId = null;
        this.limpiarFormulario();
        this.mostrarFormulario = false;
      }
    } else {
      this.crearProyecto();
    }
  }

  editarProyecto(id: string) {
    const proyecto = this.proyectos.find(p => p._id === id);
    if (proyecto) {
      this.formData = {
        nombre: proyecto.name,
        identificador: proyecto.identificador,
        fechaInicio: proyecto.fechaInicio,
        responsable: proyecto.responsable,
        descripcion: proyecto.descripcion,
        tags: proyecto.tags
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
    }
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.detalleProyecto = null;
    this.iteraciones = [];
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
            proyecto.activo = false;
            proyecto.estado = 'Archivado';
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
    if (this.projectPlanForm.invalid || !this.faseActualParaPlan) {
      return;
    }

    const nuevoPlan: ProjectPlan = {
      ...this.projectPlanForm.value,
      version: 1,
      fecha: new Date(),
      fase: this.faseActualParaPlan.name,
    };

    this.faseActualParaPlan.plan = nuevoPlan;
    this.guardarProyectos();
    this.cancelarCreacionPlan();
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
    this.selectedProjectIdForMicroincrement = projectId;
    this.mostrarMicroincrementModal = true;
  }

  closeMicroincrementModal(refresh: boolean) {
    this.mostrarMicroincrementModal = false;
    this.selectedProjectIdForMicroincrement = null;
    if (refresh) {
      // Potentially refresh data here if needed
    }
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
      tags: ''
    };
  }
}