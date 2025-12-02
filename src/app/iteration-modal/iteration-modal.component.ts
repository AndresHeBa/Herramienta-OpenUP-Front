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

  constructor(private fb: FormBuilder, private mainService: MainService) {}

  ngOnInit() {
    this.isEditMode = !!this.iteration;
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
      return;
    }

    const formData = this.iterationForm.value;

    if (this.isEditMode) {
      // Update
      this.mainService.updateProgress(this.iteration!._id, formData).subscribe({
        next: () => this.closeModal.emit(true),
        error: (err) => console.error('Error updating iteration', err)
      });
    } else {
      // Create
      const newIteration = {
        ...formData,
        projectId: this.projectId
      };
      this.mainService.postProgress(newIteration).subscribe({
        next: () => this.closeModal.emit(true),
        error: (err) => console.error('Error creating iteration', err)
      });
    }
  }

  cancel() {
    this.closeModal.emit(false);
  }

  
}