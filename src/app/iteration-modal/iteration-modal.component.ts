import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MainService } from '../service/main.service';
import { Iteration, Task } from '../models/iteration.model';

@Component({
  selector: 'app-iteration-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './iteration-modal.component.html',
  styleUrls: ['./iteration-modal.component.css']
})
export class IterationModalComponent implements OnInit {
  @Input() projectId!: string;
  @Input() iteration: Iteration | null = null;
  @Output() closeModal = new EventEmitter<boolean>();

  iterationForm!: FormGroup;
  isEditMode = false;
  phases: string[] = ['Incepción', 'Elaboración', 'Construcción', 'Transición'];

  constructor(private fb: FormBuilder, private mainService: MainService) {}

  ngOnInit() {
    console.log('🔍 Iteration data received:', this.iteration);
    
    this.isEditMode = !!this.iteration;
    
    // Log specific fields
    if (this.iteration) {
      console.log('📋 Phase:', this.iteration.phase);
      console.log('🎯 Goal:', this.iteration.goal);
      console.log('📊 All iteration fields:', Object.keys(this.iteration));
    }
    
    this.iterationForm = this.fb.group({
      iteration: [this.iteration?.iteration || '', Validators.required],
      startDate: [this.iteration?.startDate || '', Validators.required],
      endDate: [this.iteration?.endDate || '', Validators.required],
      tasks: this.fb.array(this.isEditMode ? this.iteration!.tasks.map(t => this.createTask(t)) : []),
      completionPercent: [this.iteration?.completionPercent || 0, [Validators.min(0), Validators.max(100)]],
      blockers: [this.iteration?.blockers || ''],
      observations: [this.iteration?.observations || ''],
      goal: [this.iteration?.goal || ''],
      phase: [this.iteration?.phase || ''],
      active: [this.iteration?.active || true]
    });
    
    console.log('📝 Form values after init:', this.iterationForm.value);
  }

  ngAfterViewInit() {
    console.log('👁️ IterationModalComponent - Vista inicializada');
    
    // FORZAR VISIBILIDAD DEL MODAL
    setTimeout(() => {
      const modalElement = document.querySelector('.modal') as HTMLElement;
      console.log('🔍 Elemento .modal encontrado:', modalElement);
      
      if (modalElement) {
        // Forzar estilos para hacer visible el modal
        modalElement.style.visibility = 'visible';
        modalElement.style.opacity = '1';
        modalElement.style.display = 'flex';
        modalElement.style.position = 'fixed';
        modalElement.style.zIndex = '99999';
        
        const styles = window.getComputedStyle(modalElement);
        console.log('📊 Estilos del modal después de forzar:', {
          display: styles.display,
          position: styles.position,
          zIndex: styles.zIndex,
          visibility: styles.visibility,
          opacity: styles.opacity
        });
      }
    }, 0);
  }

  createTask(task: Task = { name: '', completed: false }): FormGroup {
    return this.fb.group({
      name: [task.name, Validators.required],
      completed: [task.completed]
    });
  }

  get tasks(): FormArray {
    return this.iterationForm.get('tasks') as FormArray;
  }

  addTask() {
    this.tasks.push(this.createTask());
  }

  removeTask(index: number) {
    this.tasks.removeAt(index);
  }

  saveIteration() {
    if (this.iterationForm.invalid) {
      console.error('Form is invalid:', this.iterationForm.errors);
      return;
    }

    const formData = this.iterationForm.value;
    console.log('💾 Saving iteration with data:', formData);

    if (this.isEditMode) {
      // Update
      this.mainService.putIteracion(
        this.projectId,
        this.iteration!.iteration,
        {
          startDate: formData.startDate,
          finallyDate: formData.endDate,
          goal: formData.goal,
          phase: formData.phase,
          active: formData.active,
          tasks: formData.tasks,
          blockers: formData.blockers,
          observations: formData.observations
        }
      ).subscribe({
        next: () => {
          console.log('✅ Iteration updated successfully');
          this.closeModal.emit(true);
        },
        error: (err) => console.error('❌ Error updating iteration', err)
      });
    } else {
      // Create
      this.mainService.postIteracion(
        this.projectId,
        formData.iteration,
        formData.startDate,
        formData.endDate,
        formData.goal,
        formData.phase,
        formData.active,
        formData.tasks,
        formData.blockers,
        formData.observations
      ).subscribe({
        next: () => {
          console.log('✅ Iteration created successfully');
          this.closeModal.emit(true);
        },
        error: (err) => console.error('❌ Error creating iteration', err)
      });
    }
  }

  cancel() {
    this.closeModal.emit(false);
  }

  
}