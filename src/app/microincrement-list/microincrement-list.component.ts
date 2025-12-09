import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MainService } from '../service/main.service';
import { Microincremento } from '../models/microincrement.model';
import { Iteration } from '../models/iteration.model';
import { CommonModule } from '@angular/common';

type Phase = 'Incepción' | 'Elaboración' | 'Construcción' | 'Transición';

@Component({
  selector: 'app-microincrement-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './microincrement-list.component.html',
  styleUrl: './microincrement-list.component.css'
})
export class MicroincrementListComponent implements OnInit {
  microincrements: Microincremento[] = [];
  iterations: Iteration[] = [];
  deliverablesByPhase: Record<Phase, string[]> = {
    'Incepción': [
      'Documento de Visión',
      'Lista de Stakeholders',
      'Lista de Riesgos Iniciales',
      'Plan de Proyecto',
      'Modelo de Casos de Uso de Alto Nivel'
    ],
    'Elaboración': [
      'Modelo de Casos de Uso Detallado',
      'Modelo de Dominio',
      'Especificación Requerimientos Supl.',
      'Requerimientos No Funcionales',
      'Documento de Arquitectura',
      'Diagramas Técnicos',
      'Plan de Iteraciones',
      'Prototipo UI'
    ],
    'Construcción': [
      'Modelo de Diseño Detallado',
      'Código Fuente',
      'Casos de Prueba',
      'Manuales Usuario',
      'Documentación API'
    ],
    'Transición': [
      'Manual de Despliegue',
      'Guías de Usuario Final',
      'Informe de Testing',
      'Release Notes',
      'Material de Capacitación'
    ]
  };
  availableDeliverables: string[] = [];
  selectedIteration: Iteration | null = null;
  filterForm: FormGroup;
  newMicroincrementForm: FormGroup;
  @Input() projectId!: string; // Now correctly receiving projectId as an input

  constructor(
    private fb: FormBuilder,
    private mainService: MainService
  ) {
    this.filterForm = this.fb.group({
      iteration: [''],
      deliverable: [''],
      author: [''],
      type: [''] // Nuevo filtro por tipo
    });

    this.newMicroincrementForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      iterationId: ['', Validators.required],
      deliverable: ['', Validators.required],
      date: ['', Validators.required],
      author: ['', Validators.required],
      type: ['funcional', Validators.required], // Nuevo campo: técnico o funcional
      evidence: [''], // Nuevo campo: archivo o enlace
      value: [0, [Validators.min(0), Validators.max(10)]] // Nuevo campo: valor 0-10
    });
  }

  ngOnInit(): void {
    console.log('MicroincrementListComponent ngOnInit, projectId:', this.projectId);
    if (this.projectId) {
      this.loadIterations();
      this.loadMicroincrements();
    } else {
      console.error('MicroincrementListComponent: projectId is not provided.');
    }
  }

  loadIterations(): void {
    this.mainService.getIteraciones(this.projectId).subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.iterations = response.data;
          console.log('✅ Iterations loaded:', this.iterations);
        }
      },
      error: (error) => {
        console.error('❌ Error loading iterations:', error);
      }
    });
  }

  onIterationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const iterationId = select.value;
    
    if (!iterationId) {
      this.availableDeliverables = [];
      this.selectedIteration = null;
      return;
    }

    this.selectedIteration = this.iterations.find(it => it._id === iterationId) || null;
    
    if (this.selectedIteration && this.selectedIteration.phase) {
      const phase = this.selectedIteration.phase as Phase;
      this.availableDeliverables = this.deliverablesByPhase[phase] || [];
      console.log(`📦 Deliverables for phase ${phase}:`, this.availableDeliverables);
      
      // Reset deliverable field when iteration changes
      this.newMicroincrementForm.patchValue({ deliverable: '' });
    } else {
      this.availableDeliverables = [];
    }
  }

  loadMicroincrements(): void {
    const { iteration, deliverable, author, type } = this.filterForm.value;
    console.log('Loading microincrements for project:', this.projectId);
    console.log('Filters:', { iteration, deliverable, author, type });
    
    this.mainService.getMicroincrementList(this.projectId, iteration, deliverable, author).subscribe({
      next: (response) => {
        console.log('Microincrements response:', response);
        if (response && response.Result && response.Result.microincrements) {
          let micros = response.Result.microincrements;
          
          // Filtrar por tipo si se especificó
          if (type) {
            micros = micros.filter((m: Microincremento) => m.type === type);
          }
          
          this.microincrements = micros;
          console.log('Loaded microincrements:', this.microincrements);
        }
      },
      error: (error) => {
        console.error('Error loading microincrements', error);
      }
    });
  }

  applyFilter(): void {
    this.loadMicroincrements();
  }

  createMicroincrement(): void {
    if (this.newMicroincrementForm.valid) {
      const formValue = this.newMicroincrementForm.value;
      const selectedIter = this.iterations.find(it => it._id === formValue.iterationId);
      
      const newMicro: Omit<Microincremento, '_id' | 'status' | 'creationDate'> = {
        title: formValue.title,
        description: formValue.description,
        iteration: selectedIter?.iteration || '',
        deliverable: formValue.deliverable,
        date: new Date(formValue.date).toISOString(),
        author: formValue.author,
        projectId: this.projectId,
        type: formValue.type, // Técnico o funcional
        evidence: formValue.evidence || '', // Archivo o enlace
        value: formValue.value || 0 // Valor del microincremento
      };
      
      console.log('📦 Creating microincrement:', newMicro);
      
      this.mainService.postMicroincrement(newMicro).subscribe({
        next: (response) => {
          console.log('✅ Microincrement created', response);
          this.newMicroincrementForm.reset({
            type: 'funcional',
            value: 0
          });
          this.availableDeliverables = [];
          this.selectedIteration = null;
          this.loadMicroincrements();
        },
        error: (error) => {
          console.error('❌ Error creating microincrement', error);
        }
      });
    } else {
      console.error('⚠️ New microincrement form is invalid');
      console.log('Form errors:', this.newMicroincrementForm.errors);
      Object.keys(this.newMicroincrementForm.controls).forEach(key => {
        const control = this.newMicroincrementForm.get(key);
        if (control?.invalid) {
          console.log(`Field ${key} is invalid:`, control.errors);
        }
      });
    }
  }
}