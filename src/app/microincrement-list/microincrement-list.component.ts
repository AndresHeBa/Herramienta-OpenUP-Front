import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MainService } from '../service/main.service';
import { Microincremento } from '../models/microincrement.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-microincrement-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './microincrement-list.component.html',
  styleUrl: './microincrement-list.component.css'
})
export class MicroincrementListComponent implements OnInit {
  microincrements: Microincremento[] = [];
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
      author: ['']
    });

    this.newMicroincrementForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      iteration: ['', Validators.required],
      deliverable: ['', Validators.required],
      date: ['', Validators.required],
      author: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.projectId) {
      this.loadMicroincrements();
    } else {
      console.error('MicroincrementListComponent: projectId is not provided.');
      // Handle the case where projectId is missing, e.g., show a message or redirect
    }
  }

  loadMicroincrements(): void {
    const { iteration, deliverable, author } = this.filterForm.value;
    this.mainService.getMicroincrementList(this.projectId, iteration, deliverable, author).subscribe({
      next: (response) => {
        if (response && response.Result && response.Result.microincrements) {
          this.microincrements = response.Result.microincrements;
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
      const newMicro: Omit<Microincremento, '_id' | 'status' | 'creationDate'> = {
        ...this.newMicroincrementForm.value,
        projectId: this.projectId,
        date: new Date(this.newMicroincrementForm.value.date).toISOString() // Ensure date is in ISO format
      };
      this.mainService.postMicroincrement(newMicro).subscribe({
        next: (response) => {
          console.log('Microincrement created', response);
          this.newMicroincrementForm.reset();
          this.loadMicroincrements(); // Reload list to show the new microincrement
        },
        error: (error) => {
          console.error('Error creating microincrement', error);
        }
      });
    } else {
      console.error('New microincrement form is invalid');
    }
  }
}