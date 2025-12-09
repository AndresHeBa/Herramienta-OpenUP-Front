import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QualityService } from '../service/quality.service';
import { AuthService } from '../service/auth.service';
import { ActiveProjectService } from '../service/active-project.service';
import { TestCase, TestExecution } from '../models/test-case.model';
import { Defect } from '../models/defect.model';

@Component({
  selector: 'app-quality-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quality-management.component.html',
  styleUrls: ['./quality-management.component.css']
})
export class QualityManagementComponent implements OnInit {
  @Input() artifactData: any = null; // Recibe datos del artefacto desde artifact-uploader
  @Output() closeSection = new EventEmitter<void>();
  
  activeTab: 'testCases' | 'defects' = 'testCases';
  
  testCases: TestCase[] = [];
  testExecutions: TestExecution[] = [];
  defects: Defect[] = [];
  
  showTestCaseForm = false;
  showExecutionForm = false;
  showDefectForm = false;
  
  selectedTestCase: TestCase | null = null;
  selectedDefect: Defect | null = null;
  
  currentUser: any = null;
  projectId: string = '';
  
  // Formulario Test Case
  testCaseForm = {
    name: '',
    description: '',
    artifactId: '',
    artifactName: '',
    preconditions: '',
    steps: [{ stepNumber: 1, action: '', expectedResult: '' }],
    expectedResult: '',
    priority: 'Media' as 'Alta' | 'Media' | 'Baja'
  };
  
  // Formulario Ejecución
  executionForm = {
    testCaseId: '',
    status: 'No Ejecutado' as 'Pasó' | 'Falló' | 'Bloqueado' | 'No Ejecutado',
    actualResult: '',
    evidence: '',
    notes: '',
    iteration: ''
  };
  
  // Formulario Defecto
  defectForm = {
    title: '',
    description: '',
    severity: 'Media' as 'Crítica' | 'Alta' | 'Media' | 'Baja',
    priority: 'Media' as 'Urgente' | 'Alta' | 'Media' | 'Baja',
    testCaseId: '',
    testExecutionId: '',
    artifactId: '',
    artifactName: '',
    artifactVersion: '',
    assignedTo: '',
    stepsToReproduce: '',
    environment: ''
  };

  constructor(
    private qualityService: QualityService,
    private authService: AuthService,
    private activeProjectService: ActiveProjectService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    // Si recibe artifactData desde artifact-uploader, usa esos datos
    if (this.artifactData) {
      this.projectId = this.artifactData.projectId;
      // Pre-llenar formularios con datos del artefacto
      if (this.artifactData.artifactType) {
        this.testCaseForm.artifactId = this.artifactData._id || '';
        this.testCaseForm.artifactName = this.artifactData.artifactType || '';
        
        this.defectForm.artifactId = this.artifactData._id || '';
        this.defectForm.artifactName = this.artifactData.artifactType || '';
        this.defectForm.artifactVersion = this.artifactData.version?.toString() || '';
      }
      this.loadData();
    } else {
      // Modo standalone - obtiene proyecto activo
      this.activeProjectService.getActiveProject().subscribe(projectId => {
        if (projectId) {
          this.projectId = projectId;
          this.loadData();
        }
      });
    }
  }

  loadData() {
    this.loadTestCases();
    this.loadTestExecutions();
    this.loadDefects();
  }

  loadTestCases() {
    this.qualityService.getTestCasesByProject(this.projectId).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.testCases = response.data || [];
        }
      },
      error: (err) => console.error('Error loading test cases:', err)
    });
  }

  loadTestExecutions() {
    this.qualityService.getTestExecutionsByProject(this.projectId).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.testExecutions = response.data || [];
        }
      },
      error: (err) => console.error('Error loading test executions:', err)
    });
  }

  loadDefects() {
    this.qualityService.getDefectsByProject(this.projectId).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.defects = response.data || [];
        }
      },
      error: (err) => console.error('Error loading defects:', err)
    });
  }

  // Test Cases
  toggleTestCaseForm() {
    this.showTestCaseForm = !this.showTestCaseForm;
    if (!this.showTestCaseForm) {
      this.resetTestCaseForm();
    }
  }

  resetTestCaseForm() {
    this.testCaseForm = {
      name: '',
      description: '',
      artifactId: '',
      artifactName: '',
      preconditions: '',
      steps: [{ stepNumber: 1, action: '', expectedResult: '' }],
      expectedResult: '',
      priority: 'Media'
    };
  }

  addStep() {
    const newStepNumber = this.testCaseForm.steps.length + 1;
    this.testCaseForm.steps.push({ stepNumber: newStepNumber, action: '', expectedResult: '' });
  }

  removeStep(index: number) {
    this.testCaseForm.steps.splice(index, 1);
    // Renumerar pasos
    this.testCaseForm.steps.forEach((step, i) => step.stepNumber = i + 1);
  }

  saveTestCase() {
    const testCase = {
      ...this.testCaseForm,
      projectId: this.projectId,
      createdBy: this.currentUser?.username || 'unknown'
    };

    this.qualityService.createTestCase(testCase).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          alert('Caso de prueba creado exitosamente');
          this.loadTestCases();
          this.toggleTestCaseForm();
        }
      },
      error: (err) => alert('Error al crear caso de prueba: ' + (err.error?.data || 'Error desconocido'))
    });
  }

  // Executions
  openExecutionForm(testCase: TestCase) {
    this.selectedTestCase = testCase;
    this.executionForm.testCaseId = testCase._id;
    this.showExecutionForm = true;
  }

  closeExecutionForm() {
    this.showExecutionForm = false;
    this.selectedTestCase = null;
    this.resetExecutionForm();
  }

  resetExecutionForm() {
    this.executionForm = {
      testCaseId: '',
      status: 'No Ejecutado',
      actualResult: '',
      evidence: '',
      notes: '',
      iteration: ''
    };
  }

  saveExecution() {
    const execution = {
      ...this.executionForm,
      projectId: this.projectId,
      executedBy: this.currentUser?.username || 'unknown'
    };

    this.qualityService.executeTestCase(execution).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          alert('Ejecución registrada exitosamente');
          this.loadTestExecutions();
          this.closeExecutionForm();
          
          // Si falló, preguntar si quiere crear un defecto
          if (execution.status === 'Falló') {
            if (confirm('¿Desea crear un defecto relacionado?')) {
              this.openDefectFormFromExecution(response.data);
            }
          }
        }
      },
      error: (err) => alert('Error al registrar ejecución: ' + (err.error?.data || 'Error desconocido'))
    });
  }

  // Defects
  toggleDefectForm() {
    this.showDefectForm = !this.showDefectForm;
    if (!this.showDefectForm) {
      this.resetDefectForm();
    }
  }

  openDefectFormFromExecution(execution: TestExecution) {
    this.defectForm.testCaseId = execution.testCaseId;
    this.defectForm.testExecutionId = execution._id;
    this.showDefectForm = true;
  }

  resetDefectForm() {
    this.defectForm = {
      title: '',
      description: '',
      severity: 'Media',
      priority: 'Media',
      testCaseId: '',
      testExecutionId: '',
      artifactId: '',
      artifactName: '',
      artifactVersion: '',
      assignedTo: '',
      stepsToReproduce: '',
      environment: ''
    };
  }

  saveDefect() {
    const defect = {
      ...this.defectForm,
      projectId: this.projectId,
      reportedBy: this.currentUser?.username || 'unknown'
    };

    this.qualityService.createDefect(defect).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          alert('Defecto creado exitosamente');
          this.loadDefects();
          this.toggleDefectForm();
        }
      },
      error: (err) => alert('Error al crear defecto: ' + (err.error?.data || 'Error desconocido'))
    });
  }

  viewDefect(defect: Defect) {
    this.selectedDefect = defect;
  }

  closeDefectDetails() {
    this.selectedDefect = null;
  }

  updateDefectStatus(defect: Defect, newStatus: string) {
    this.qualityService.updateDefect(defect._id, { status: newStatus }, this.currentUser?.username || 'unknown').subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          alert('Estado actualizado');
          this.loadDefects();
          if (this.selectedDefect && this.selectedDefect._id === defect._id) {
            this.selectedDefect = response.data;
          }
        }
      },
      error: (err) => alert('Error al actualizar: ' + (err.error?.data || 'Error desconocido'))
    });
  }

  getExecutionsForTestCase(testCaseId: string): TestExecution[] {
    return this.testExecutions.filter(ex => ex.testCaseId === testCaseId);
  }

  getLastExecution(testCaseId: string): TestExecution | undefined {
    const executions = this.getExecutionsForTestCase(testCaseId);
    return executions.length > 0 ? executions[executions.length - 1] : undefined;
  }

  getSeverityClass(severity: string): string {
    const map: any = {
      'Crítica': 'severity-critical',
      'Alta': 'severity-high',
      'Media': 'severity-medium',
      'Baja': 'severity-low'
    };
    return map[severity] || '';
  }

  getStatusClass(status: string): string {
    const map: any = {
      'Abierto': 'status-open',
      'En Progreso': 'status-in-progress',
      'Resuelto': 'status-resolved',
      'Cerrado': 'status-closed',
      'Reabierto': 'status-reopened',
      'Pasó': 'status-passed',
      'Falló': 'status-failed',
      'Bloqueado': 'status-blocked',
      'No Ejecutado': 'status-not-executed'
    };
    return map[status] || '';
  }
}
