import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainService } from '../service/main.service';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-modal.component.html',
  styleUrls: ['./history-modal.component.css']
})
export class HistoryModalComponent implements OnInit {
  @Input() projectId!: string;
  @Output() closeModal = new EventEmitter<void>();

  history: any[] = [];
  loadingHistory = true;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    if (this.projectId) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.loadingHistory = true;
    this.mainService.getHistory(this.projectId).subscribe({
      next: (response) => {
        this.history = response.history;
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.loadingHistory = false;
      }
    });
  }

  close() {
    this.closeModal.emit();
  }
}