import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainService } from '../service/main.service';
import { ProgressSummary } from '../models/progress-summary.model';
import { Iteration } from '../models/iteration.model';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  @Input() projectId!: string;
  @Output() newIteration = new EventEmitter<void>();
  @Output() editIteration = new EventEmitter<Iteration>();
  @Output() viewHistory = new EventEmitter<void>();

  summary: ProgressSummary | null = null;
  iterations: Iteration[] = [];
  loadingSummary = true;
  loadingIterations = true;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    if (this.projectId) {
      this.loadSummary();
      this.loadIterations();
    }
  }

  loadSummary() {
    this.loadingSummary = true;
    this.mainService.getSummary(this.projectId).subscribe({
      next: (response) => {
        this.summary = response.Result;
        this.loadingSummary = false;
      },
      error: (error) => {
        console.error('Error loading progress summary:', error);
        this.loadingSummary = false;
      }
    });
  }

  loadIterations() {
    this.loadingIterations = true;
    this.mainService.getProgress(this.projectId).subscribe({
      next: (response) => {
        this.iterations = response.Result;
        this.loadingIterations = false;
      },
      error: (error) => {
        console.error('Error loading iterations:', error);
        this.loadingIterations = false;
      }
    });
  }

  openIterationModalForCreation() {
    this.newIteration.emit();
  }

  openIterationModalForEdit(iteration: Iteration) {
    this.editIteration.emit(iteration);
  }

  openHistoryModal() {
    this.viewHistory.emit();
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }
}