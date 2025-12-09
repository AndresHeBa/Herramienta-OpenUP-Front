import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectClosureService, ValidationResult, CloseProjectRequest } from '../service/project-closure.service';

@Component({
  selector: 'app-project-closure-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-closure-modal.component.html',
  styleUrl: './project-closure-modal.component.css'
})
export class ProjectClosureModalComponent implements OnInit {
  @Input() projectId: string = '';
  @Input() projectName: string = '';
  @Output() closeModal = new EventEmitter<boolean>(); // true si se cerró el proyecto

  validation: ValidationResult | null = null;
  isValidating = false;
  isClosing = false;
  validationError: string | null = null;
  
  // Cierre forzado
  forceClose = false;
  justification = '';
  closureNotes = '';
  
  // Resultado del cierre
  closureSuccess = false;
  closureError: string | null = null;

  constructor(private closureService: ProjectClosureService) {}

  ngOnInit(): void {
    this.validateProject();
  }

  validateProject(): void {
    this.isValidating = true;
    this.validationError = null;

    this.closureService.validateClosure(this.projectId).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.validation = response.data;
        } else {
          this.validationError = response.strMessage || 'Error al validar el proyecto';
        }
        this.isValidating = false;
      },
      error: (err) => {
        console.error('Error validating project:', err);
        this.validationError = 'Error al conectar con el servidor';
        this.isValidating = false;
      }
    });
  }

  onCloseProject(): void {
    if (!this.validation) return;

    // Validaciones
    if (!this.validation.canClose && !this.forceClose) {
      alert('No se puede cerrar el proyecto. Hay artefactos obligatorios faltantes.');
      return;
    }

    if (this.forceClose && !this.justification.trim()) {
      alert('La justificación es obligatoria para cierre forzado');
      return;
    }

    const request: CloseProjectRequest = {
      projectId: this.projectId,
      forceClose: this.forceClose,
      justification: this.forceClose ? this.justification : undefined,
      closureNotes: this.closureNotes || undefined
    };

    this.isClosing = true;
    this.closureError = null;

    this.closureService.closeProject(request).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.closureSuccess = true;
          setTimeout(() => {
            this.closeModal.emit(true);
          }, 2000);
        } else {
          this.closureError = response.strMessage || 'Error al cerrar el proyecto';
        }
        this.isClosing = false;
      },
      error: (err) => {
        console.error('Error closing project:', err);
        this.closureError = err.error?.data || 'Error al conectar con el servidor';
        this.isClosing = false;
      }
    });
  }

  onCancel(): void {
    this.closeModal.emit(false);
  }

  downloadPDF(): void {
    this.closureService.downloadClosurePDF(this.projectId);
  }

  getValidationStatusClass(): string {
    if (!this.validation) return '';
    
    if (this.validation.canClose && this.validation.warnings.length === 0) {
      return 'status-success';
    } else if (this.validation.canClose && this.validation.warnings.length > 0) {
      return 'status-warning';
    } else {
      return 'status-error';
    }
  }

  getValidationMessage(): string {
    if (!this.validation) return '';
    return this.closureService.getValidationMessage(this.validation);
  }
}
