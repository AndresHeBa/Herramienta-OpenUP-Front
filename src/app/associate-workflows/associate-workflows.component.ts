import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// La asociación de entregables a flujos se hará en artifact-uploader
import { WorkflowService } from '../service/workflow.service';

interface State {
  name: string;
  responsible: string[];
  actions: string[];
}

interface Workflow {
  _id?: string;
  name: string;
  states: State[];
}

// Eliminado: interfaz Artifact. La asociación se maneja en artifact-uploader.

@Component({
  selector: 'app-associate-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './associate-workflows.component.html',
  styleUrls: ['./associate-workflows.component.css']
})
export class AssociateWorkflowsComponent implements OnInit {
  workflows: Workflow[] = [];

  selectedWorkflow: Workflow | null = null;
  editingWorkflow: Workflow | null = null;
  workflowForm: FormGroup;

  // Historial opcional por flujo (no de artefactos)
  workflowHistory: any[] = [];

  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService
  ) {
    this.workflowForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadWorkflows();
  }

  private toArray<T>(val: any): T[] {
    if (!val) return [] as T[];
    if (Array.isArray(val)) return val as T[];
    // Some backends wrap arrays under Result or result; ensure it's an array
    const inner = val?.Result ?? val?.result ?? val;
    if (Array.isArray(inner)) return inner as T[];
    // If inner is an object map, convert to array of values
    if (typeof inner === 'object') return Object.values(inner) as T[];
    return [] as T[];
  }

  loadWorkflows() {
    this.loading = true;
    this.workflowService.getWorkflows().subscribe({
      next: (res: any) => {
        const raw = this.toArray<Workflow>(res);
        this.workflows = this.normalizeWorkflows(raw);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los flujos';
        this.loading = false;
      }
    });
  }

  // Eliminado: carga y asociación de artefactos. Se realizará en artifact-uploader.

  newWorkflow() {
    this.editingWorkflow = { name: '', states: [] };
    this.selectedWorkflow = null;
    this.workflowForm.reset();
  }

  editWorkflow(w: Workflow) {
    this.editingWorkflow = JSON.parse(JSON.stringify(w)); // clone
    this.workflowForm.patchValue({ name: w.name });
  }

  saveWorkflow() {
    if (!this.editingWorkflow) return;
    const payload = { ...this.editingWorkflow, name: this.workflowForm.value.name };
    if (payload._id) {
      this.workflowService.updateWorkflow(payload._id, payload).subscribe({
        next: () => { this.loadWorkflows(); this.editingWorkflow = null; },
        error: () => this.error = 'Error al guardar el flujo'
      });
    } else {
      this.workflowService.createWorkflow(payload).subscribe({
        next: () => { this.loadWorkflows(); this.editingWorkflow = null; },
        error: () => this.error = 'Error al crear el flujo'
      });
    }
  }

  cancelEdit() {
    this.editingWorkflow = null;
    this.workflowForm.reset();
  }

  addState() {
    if (!this.editingWorkflow) return;
    this.editingWorkflow.states.push({ name: '', responsible: [], actions: [] });
  }

  removeState(i: number) {
    if (!this.editingWorkflow) return;
    this.editingWorkflow.states.splice(i, 1);
  }

  moveStateUp(i: number) {
    if (!this.editingWorkflow || i <= 0) return;
    const s = this.editingWorkflow.states.splice(i, 1)[0];
    this.editingWorkflow.states.splice(i - 1, 0, s);
  }

  moveStateDown(i: number) {
    if (!this.editingWorkflow || i >= this.editingWorkflow.states.length - 1) return;
    const s = this.editingWorkflow.states.splice(i, 1)[0];
    this.editingWorkflow.states.splice(i + 1, 0, s);
  }

  deleteWorkflow(id?: string) {
    if (!id) return;
    if (!confirm('¿Eliminar el flujo de trabajo? Esta acción no se puede deshacer.')) return;
    this.workflowService.deleteWorkflow(id).subscribe({
      next: () => this.loadWorkflows(),
      error: () => this.error = 'No se pudo eliminar el flujo'
    });
  }

  selectWorkflow(w: Workflow) {
    this.selectedWorkflow = w;
  }

  // Eliminadas funciones de asociación y cambio de estado en artefactos.

  private normalizeWorkflows(list: Workflow[]): Workflow[] {
    return (list || []).map(w => {
      const statesArr: any[] = this.toArray(w.states);
      const normalizedStates: State[] = statesArr.map((s: any) => {
        const name = s?.name ?? String(s ?? '');
        // responsible puede venir como string, objeto o array
        let responsible: string[] = [];
        const r = s?.responsible ?? s?.responsables ?? [];
        if (Array.isArray(r)) {
          responsible = r.map(x => String(x)).filter(Boolean);
        } else if (typeof r === 'string') {
          responsible = r.split(',').map(t => t.trim()).filter(Boolean);
        } else if (typeof r === 'object' && r) {
          responsible = Object.values(r).map(x => String(x)).filter(Boolean);
        }
        // actions similar
        let actions: string[] = [];
        const a = s?.actions ?? [];
        if (Array.isArray(a)) actions = a.map(x => String(x)).filter(Boolean);
        else if (typeof a === 'string') actions = a.split(',').map(t => t.trim()).filter(Boolean);
        else if (typeof a === 'object' && a) actions = Object.values(a).map(x => String(x)).filter(Boolean);
        return { name, responsible, actions } as State;
      });
      return { ...w, states: normalizedStates } as Workflow;
    });
  }

  formatResponsible(state: State): string {
    if (!state) return '-';
    const r: any = (state as any).responsible ?? (state as any).responsables;
    if (!r) return '-';
    if (Array.isArray(r)) return r.join(', ') || '-';
    if (typeof r === 'string') return r || '-';
    if (typeof r === 'object') return Object.values(r).join(', ') || '-';
    return '-';
  }

  onChangeResponsible(index: number, csv: string) {
    if (!this.editingWorkflow) return;
    const arr = (csv || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    this.editingWorkflow.states[index].responsible = arr;
  }
}
