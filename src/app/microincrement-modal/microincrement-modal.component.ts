import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MicroincrementListComponent } from '../microincrement-list/microincrement-list.component';

@Component({
  selector: 'app-microincrement-modal',
  standalone: true,
  imports: [CommonModule, MicroincrementListComponent],
  templateUrl: './microincrement-modal.component.html',
  styleUrl: './microincrement-modal.component.css'
})
export class MicroincrementModalComponent {
  @Input() projectId!: string;
  @Output() closeModal = new EventEmitter<boolean>();

  constructor() { }

  onCloseModal(refresh: boolean = false): void {
    this.closeModal.emit(refresh);
  }
}