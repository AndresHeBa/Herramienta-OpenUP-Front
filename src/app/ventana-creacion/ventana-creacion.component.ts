import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService } from '../service/main.service';

interface Fase {
  nombre: string;
  estado: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './ventana-creacion.component.html',
  styleUrl: './ventana-creacion.component.css'
})
export class VentanaCreacionComponent implements OnInit {
  proyectos: Proyecto[] = [];
  mostrarFormulario = false;
  editandoId: string | null = null;
  detalleProyecto: Proyecto | null = null;
  mostrarDetalle = false;

  constructor(private mainService: MainService) {}

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