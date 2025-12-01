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
import { MicroincrementModalComponent } from '../microincrement-modal/microincrement-modal.component'; // Import the new modal
import { Iteration } from '../models/iteration.model';

interface Fase {
  nombre: string;
  estado: string;
  plan?: ProjectPlan;
}

interface Proyecto {
  id: string;
  nombre: string;
  identificador: string;
  fechaInicio: string;
  responsable: string;
  descripcion: string;
  tags: string;
  activo: boolean;
  estado: string;
  fases: Fase[];
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

  mostrarIterationModal = false;
  selectedIteration: Iteration | null = null;

  mostrarHistoryModal = false;

  mostrarMicroincrementModal = false; // New flag for Microincrement modal
  selectedProjectIdForMicroincrement: string | null = null; // To pass projectId to the modal

  constructor(private mainService: MainService, private fb: FormBuilder, public activeProject: ActiveProjectService, private router: Router) { }

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
    // Cargar proyectos desde localStorage si existen
    const proyectosGuardados = localStorage.getItem('proyectos');
    if (proyectosGuardados) {
      this.proyectos = JSON.parse(proyectosGuardados);
    }

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
      id: Date.now().toString(),
      nombre: this.formData.nombre,
      identificador: this.formData.identificador,
      fechaInicio: this.formData.fechaInicio,
      responsable: this.formData.responsable,
      descripcion: this.formData.descripcion,
      tags: this.formData.tags,
      estado: 'Creado',
      activo: true,
      fases: JSON.parse(JSON.stringify(this.fasesPredeterminadas))
    };

    //mandar a la API
    this.mainService.postproyect(
      nuevoProyecto.nombre,
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
      const index = this.proyectos.findIndex(p => p.id === this.editandoId);
      if (index !== -1) {
        this.proyectos[index] = {
          ...this.proyectos[index],
          nombre: this.formData.nombre,
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
    const proyecto = this.proyectos.find(p => p.id === id);
    if (proyecto) {
      this.formData = {
        nombre: proyecto.nombre,
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
    this.detalleProyecto = this.proyectos.find(p => p.id === id) || null;
    this.mostrarDetalle = true;
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.detalleProyecto = null;
    this.cancelarCreacionPlan();
  }

  openArtifacts(projectIdentifier: string) {
    this.activeProject.setActiveProject(projectIdentifier);
    // close modal and navigate to artifacts view for project
    this.cerrarDetalle();
    // navigate with projectId param
    this.router.navigate(['/artifacts', projectIdentifier]);
  }

  eliminarProyecto(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      this.proyectos = this.proyectos.filter(p => p.id !== id);
      this.guardarProyectos();
    }
  }

  archivarProyecto(id: string) {
    if (confirm('¿Estás seguro de que deseas archivar este proyecto?')) {
      this.mainService.deactivateProject(id).subscribe({
        next: (response) => {
          console.log('Proyecto archivado en la API:', response);
          const proyecto = this.proyectos.find(p => p.id === id);
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
      fase: this.faseActualParaPlan.nombre,
    };

    this.faseActualParaPlan.plan = nuevoPlan;
    this.guardarProyectos();
    this.cancelarCreacionPlan();
  }

  openIterationModal(iteration: Iteration | null) {
    this.selectedIteration = iteration;
    this.mostrarIterationModal = true;
  }

  closeIterationModal(refresh: boolean) {
    this.mostrarIterationModal = false;
    this.selectedIteration = null;
    if (refresh) {
      // Logic to refresh progress data in the progress component
      // This will be handled by re-rendering the progress component.
      // For now, just close the modal.
    }
  }

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