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

  iterations: Iteration[] = [];
  summary: ProgressSummary | null = null;
  loadingSummary = true;
  loadingIterations = true;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    console.log('🎯 Progress component initialized with projectId:', this.projectId);
    console.log('🔢 ProjectId length:', this.projectId?.length);
    console.log('🔤 ProjectId type:', typeof this.projectId);
    
    if (this.projectId) {
      this.loadSummary();
      this.loadIterations();
    } else {
      console.error('❌ No projectId provided to progress component');
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
    console.log('🔍 Loading iterations for projectId:', this.projectId);
    
    this.mainService.getIteraciones(this.projectId).subscribe({
      next: (response) => {
        console.log('✅ Response from getIteraciones:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📊 Response.data:', response.data);
        console.log('📊 Response.data type:', typeof response.data);
        console.log('📊 Is Array?', Array.isArray(response.data));
        
        // El backend devuelve { status: 200, data: [], message: "..." }
        if (response && response.data && Array.isArray(response.data)) {
          this.iterations = response.data;
          console.log('✅ Iterations loaded:', this.iterations.length, this.iterations);
        } else if (response && Array.isArray(response)) {
          // Por si el backend devuelve directamente un array
          this.iterations = response;
          console.log('✅ Iterations loaded (direct array):', this.iterations.length, this.iterations);
        } else {
          console.warn('⚠️ No iterations data found in response');
          this.iterations = [];
        }
        
        this.loadingIterations = false;
      },
      error: (error) => {
        console.error('❌ Error loading iterations:', error);
        this.iterations = [];
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