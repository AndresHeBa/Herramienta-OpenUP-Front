import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService } from '../service/workflow.service';
import { ConfigurationService } from '../service/configuration.service';
import { ActiveProjectService } from '../service/active-project.service';
import { ArtifactService } from '../service/artifact.service';
import { BuildService } from '../service/build.service';
import { finalize } from 'rxjs/operators';
// PDF generation for history export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommonModule } from '@angular/common';
import { QualityManagementComponent } from '../quality-management/quality-management.component';
import { OpenUPConfiguration } from '../models/openup-configuration.model';

type Phase = 'Incepción' | 'Elaboración' | 'Construcción' | 'Transición';

@Component({
  selector: 'app-artifact-uploader',
  standalone: true,
  templateUrl: './artifact-uploader.component.html',
  styleUrls: ['./artifact-uploader.component.css'],
  imports: [ReactiveFormsModule, FormsModule, CommonModule, QualityManagementComponent]
})
export class ArtifactUploaderComponent implements OnInit {
  form: FormGroup;
  projectId = ''; // Se inicializará desde la ruta
  phases: Phase[] = ['Incepción', 'Elaboración', 'Construcción', 'Transición'];
  currentPhaseIndex = 0;
  currentPhase: Phase = this.phases[this.currentPhaseIndex];
  requiredArtifactsMap: Record<Phase, string[]> = {
    'Incepción': [
      'Documento de Visión',
      'Lista de Stakeholders',
      'Lista de Riesgos Iniciales',
      'Plan de Proyecto',
      'Modelo de Casos de Uso de Alto Nivel'
    ],
    'Elaboración': [
      'Modelo de Casos de Uso Detallado',
      'Modelo de Dominio',
      'Especificación Requerimientos Supl.',
      'Requerimientos No Funcionales',
      'Documento de Arquitectura',
      'Diagramas Técnicos',
      'Plan de Iteraciones',
      'Prototipo UI'
    ],
    'Construcción': [
      'Modelo de Diseño Detallado',
      'Código Fuente',
      'Casos de Prueba',
      'Resultados de Pruebas',
      'Registro de Iteraciones'
    ],
    'Transición': [
      'Manual de Usuario',
      'Manual Técnico',
      'Plan de Despliegue',
      'Documento de Cierre',
      'Build Final',
      'Reporte de Pruebas Beta'
    ]
  };

  artifacts: any[] = [];
  allProjectArtifacts: any[] = []; // HU-020: All artifacts from all phases
  uploadProgress = 0;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  isLoadingArtifacts = false;
  // filas en modo edición/preparación (mostrar campos para subir)
  editingRows = new Set<number>();
  // modal state
  modalIndex: number | null = null;
  rowEditForm: FormGroup | null = null;
  // history modal state
  historyModalIndex: number | null = null;
  historyList: any[] = [];
  compareSelection: number[] = [];

  // HU-012: workflows and per-type selections
  workflows: any[] = [];
  selectedWorkflowByType: Record<string, string> = {};
  selectedStateByType: Record<string, string> = {};

  // Quality management state
  showQualitySection = false;
  selectedArtifactForQuality: any = null;

  // Project configuration
  projectConfiguration: OpenUPConfiguration | null = null;

  // HU-020: Reassign artifacts modal state
  reassignModalIndex: number | null = null;
  reassignTargetPhase: Phase | null = null;
  reassignReason = '';
  movementHistory: any[] = [];
  showMovementHistory = false;
  isReassigning = false;

  // HU-022: Builds management state
  buildsModalIndex: number | null = null;
  buildsList: any[] = [];
  projectRepositoryUrl: string | null = null;
  isRegisteringBuild = false;
  buildsCountCache: Record<string, number> = {};
  newBuild = {
    buildId: '',
    commitHash: '',
    status: 'success',
    buildDate: '',
    logs: ''
  };

  constructor(
    private fb: FormBuilder, 
    private svc: ArtifactService, 
    private route: ActivatedRoute, 
    private activeProject: ActiveProjectService, 
    private router: Router, 
    private workflowSvc: WorkflowService,
    private configService: ConfigurationService,
    private buildService: BuildService
  ) {
    this.form = this.fb.group({
      artifactType: [''],
      phase: [this.currentPhase, Validators.required],
      // dynamic per-type fields
      artifactFields: this.fb.array([]),
      author: [''],
      date: [new Date().toISOString(), Validators.required],
      isMandatory: [false],
      prototypeLink: [''],
      externalLink: [''],
      tags: [''],
      file: [null],
      // structured entries for test cases and iterations
      testCases: this.fb.array([]),
      iterations: this.fb.array([])
    });
  }

  // helper to access artifactFields FormArray
  get artifactFields(): FormArray { return this.form.get('artifactFields') as FormArray; }

  // populate artifactFields based on current phase required artifacts
  private createArtifactFieldsForPhase() {
    // clear existing
    while (this.artifactFields.length) this.artifactFields.removeAt(0);
    
    // Start with predefined types for this phase
    const predefinedTypes = this.requiredArtifactsMap[this.currentPhase] || [];
    
    // Add types from actually uploaded artifacts in this phase
    const uploadedTypes = [...new Set(
      this.artifacts
        .filter(a => a.phase === this.currentPhase)
        .map(a => a.artifactType)
    )];
    
    // Combine: predefined types + uploaded types (avoiding duplicates)
    const allTypes = [...new Set([...predefinedTypes, ...uploadedTypes])];
    
    console.log(`📋 Phase ${this.currentPhase}: ${predefinedTypes.length} predefined + ${uploadedTypes.length} uploaded = ${allTypes.length} total types`);
    
    allTypes.forEach(type => {
      this.artifactFields.push(this.fb.group({
        artifactType: [type],
        file: [null],
        author: [''],
        isMandatory: [false],
        prototypeLink: [''],
        externalLink: [''],
        tags: [''],
        observations: ['']
      }));
    });
  }

  ngOnInit(): void {
    // Obtener el ID del proyecto desde los parámetros de la ruta (si existe)
    this.route.paramMap.subscribe(params => {
      const projectId = params.get('projectId');
      if (projectId) {
        this.projectId = projectId;
        this.loadProjectConfiguration();
      }
    });

    // Suscribirse a cambios de proyecto activo desde la UI (ventana de creación)
    this.activeProject.getActiveProject().subscribe(id => {
      if (id) {
        this.projectId = id;
        this.loadProjectConfiguration();
      }
    });
    // if there's already a current active project in service, load it
    const cur = this.activeProject.getCurrent();
    if (cur) {
      this.projectId = cur;
      this.loadProjectConfiguration();
    }
    // Load workflows for HU-012 linking
    this.loadWorkflows();
  }

  private toArray<T>(val: any): T[] {
    if (!val) return [] as T[];
    if (Array.isArray(val)) return val as T[];
    const inner = val?.Result ?? val?.result ?? val?.data ?? val;
    if (Array.isArray(inner)) return inner as T[];
    if (typeof inner === 'object') return Object.values(inner) as T[];
    return [] as T[];
  }

  loadWorkflows() {
    // If project configuration has workflows, use those
    if (this.projectConfiguration?.workflows && this.projectConfiguration.workflows.length > 0) {
      this.workflows = this.projectConfiguration.workflows.filter(w => w.active !== false);
      console.log('✅ Using workflows from project configuration:', this.workflows);
      return;
    }

    // Otherwise, load from backend (which should use adapter to get active config workflows)
    this.workflowSvc.getWorkflows().subscribe({
      next: (res: any) => {
        this.workflows = this.toArray(res);
        console.log('✅ Workflows loaded from backend:', this.workflows);
      },
      error: () => {
        console.warn('No se pudieron cargar los flujos de trabajo');
        this.workflows = [];
      }
    });
  }

  loadProjectConfiguration() {
    if (!this.projectId) {
      console.warn('No project ID available to load configuration');
      this.loadRequiredArtifactTypes();
      return;
    }

    console.log('🔍 Loading configuration for project:', this.projectId);
    this.configService.getProjectConfiguration(this.projectId).subscribe({
      next: (response) => {
        console.log('📦 Configuration response:', response);
        if (response && response.data) {
          this.projectConfiguration = response.data;
          console.log('✅ Project configuration loaded for artifacts:', this.projectConfiguration);
          
          // Update phases from configuration
          this.updatePhasesFromConfiguration();
          
          // Update artifact types from configuration
          this.updateArtifactTypesFromConfiguration();
          
          // Load workflows from configuration
          this.loadWorkflows();
          
          // Load artifacts after configuration is loaded
          this.loadArtifacts();
        } else {
          console.warn('⚠️ No configuration data in response:', response);
          this.loadRequiredArtifactTypes();
        }
      },
      error: (error) => {
        console.error('❌ Error loading project configuration:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        // Fallback to default behavior
        this.loadRequiredArtifactTypes();
      }
    });
  }

  updatePhasesFromConfiguration() {
    if (!this.projectConfiguration || !this.projectConfiguration.phases || this.projectConfiguration.phases.length === 0) {
      console.log('Using default phases');
      return;
    }

    // Extract phase names from configuration, sorted by order
    const configPhases = this.projectConfiguration.phases
      .sort((a, b) => a.order - b.order)
      .map(phase => phase.name as Phase);

    if (configPhases.length > 0) {
      this.phases = configPhases;
      // Reset current phase index if needed
      if (this.currentPhaseIndex >= this.phases.length) {
        this.currentPhaseIndex = 0;
      }
      this.currentPhase = this.phases[this.currentPhaseIndex];
      console.log('✅ Phases updated from configuration:', this.phases);
    }
  }

  updateArtifactTypesFromConfiguration() {
    if (!this.projectConfiguration || !this.projectConfiguration.artifactTypes || this.projectConfiguration.artifactTypes.length === 0) {
      console.log('No artifact types in configuration, using defaults');
      this.loadRequiredArtifactTypes();
      return;
    }

    // Group artifact types by phase
    const grouped: Record<string, string[]> = {};
    
    // Initialize with empty arrays for all phases
    this.phases.forEach(phase => {
      grouped[phase] = [];
    });

    // Group artifacts by their phase
    this.projectConfiguration.artifactTypes.forEach(artifact => {
      if (artifact.phase && grouped[artifact.phase]) {
        grouped[artifact.phase].push(artifact.name);
      }
    });

    // Update the map with configuration data
    this.requiredArtifactsMap = grouped as Record<Phase, string[]>;
    console.log('✅ Artifact types updated from configuration:', this.requiredArtifactsMap);

    // Recreate fields for current phase
    this.createArtifactFieldsForPhase();
  }

  // Load required artifact types from backend and group them by phase
  loadRequiredArtifactTypes() {
    // default fallback will be the existing hardcoded map; attempt to replace with backend data
    this.svc.getArtifactTypes().subscribe({
      next: (res: any) => {
        const list = res?.Result || res?.result || res?.data || res;
        if (Array.isArray(list)) {
          const grouped: Record<Phase, string[]> = {
            'Incepción': [],
            'Elaboración': [],
            'Construcción': [],
            'Transición': []
          };
          list.forEach((it: any) => {
            const phase = it.phase || it.Phase || '';
            const type = it.artifactType || it.artifact || it.name;
            if (phase && typeof grouped[phase as Phase] !== 'undefined' && type) {
              grouped[phase as Phase].push(type);
            }
          });
          // if we received any data, replace the local map
          const anyFilled = Object.values(grouped).some(arr => arr.length > 0);
          if (anyFilled) {
            this.requiredArtifactsMap = grouped;
          }
        }
        // create fields for current phase using either server data or fallback
        this.createArtifactFieldsForPhase();
        // refresh artifacts list
        this.loadArtifacts();
      },
      error: (err) => {
        console.warn('No se pudieron obtener los tipos requeridos desde backend, usando mapa local.', err);
        this.createArtifactFieldsForPhase();
        this.loadArtifacts();
      }
    });
  }

  // FormArray helpers
  get testCases(): FormArray { return this.form.get('testCases') as FormArray; }
  get iterations(): FormArray { return this.form.get('iterations') as FormArray; }

  addTestCase(initial?: any) {
    this.testCases.push(this.fb.group({
      testId: [initial?.testId || '', Validators.required],
      result: [initial?.result || '', Validators.required],
      defects: [initial?.defects || '']
    }));
  }

  removeTestCase(i: number) { this.testCases.removeAt(i); }

  addIteration(initial?: any) {
    this.iterations.push(this.fb.group({
      activity: [initial?.activity || '', Validators.required],
      comments: [initial?.comments || ''],
      date: [initial?.date || new Date().toISOString()]
    }));
  }

  removeIteration(i: number) { this.iterations.removeAt(i); }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const f = input.files[0];
      this.form.patchValue({ file: f });
    }
  }

  // file change for per-type fields
  onArtifactFileChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const f = input.files[0];
      const ctrl = this.artifactFields.at(index);
      ctrl.patchValue({ file: f });
    }
  }

  buildFormData(): FormData {
    const fd = new FormData();
    // Support uploading multiple artifact entries (one per required type)
    fd.append('projectId', this.projectId);
    fd.append('phase', this.currentPhase);

    const artifactsMeta: any[] = [];
    this.artifactFields.controls.forEach((ctrl, idx) => {
      const val = ctrl.value;
      if (val && val.file) {
        const key = `file_${idx}`;
        fd.append(key, val.file, val.file.name);
        // compute next version for this artifact type in current phase
        const sameType = this.artifacts.filter(a => a.artifactType === val.artifactType && a.phase === this.currentPhase);
        const maxVersion = sameType.reduce((m, x) => Math.max(m, Number(x.version) || 0), 0);
        const nextVersion = maxVersion + 1;

        artifactsMeta.push({
          fileKey: key,
          artifactType: val.artifactType,
          author: val.author || this.form.value.author,
          date: new Date().toISOString(),
          isMandatory: !!val.isMandatory,
          prototypeLink: val.prototypeLink || null,
          externalLink: val.externalLink || null,
          tags: (val.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
          observations: val.observations || ''
        });
      }
    });

    // include structured entries (testCases, iterations) as before
    const structured: any = {};
    if (this.testCases.length) structured.testCases = this.testCases.value;
    if (this.iterations.length) structured.iterations = this.iterations.value;
    fd.append('structuredData', JSON.stringify(structured));

    // Attach artifacts metadata as JSON; backend should map fileKey -> file
    fd.append('artifacts', JSON.stringify(artifactsMeta));

    return fd;
  }

  // build FormData for a single artifactFields entry
  private buildFormDataForIndex(index: number): FormData {
    const ctrl = this.artifactFields.at(index);
    const val = ctrl.value;
    const fd = new FormData();
    fd.append('projectId', this.projectId);
    fd.append('phase', this.currentPhase);
    fd.append('artifactType', val.artifactType || '');
    // Version is assigned by the backend; do not send client-side
    fd.append('author', val.author || this.form.value.author || '');
    fd.append('date', new Date().toISOString());
    fd.append('isMandatory', val.isMandatory ? 'true' : 'false');
    if (val.prototypeLink) fd.append('url', val.prototypeLink);
    if (val.externalLink) fd.append('externalLink', val.externalLink);
    if (val.observations) fd.append('observations', val.observations);
    const tags: string[] = (val.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean) as string[];
    if (tags.length) tags.forEach((t: string) => fd.append('tags', t));
    // structured data included once per batch (optional)
    const structured: any = {};
    if (this.testCases.length) structured.testCases = this.testCases.value;
    if (this.iterations.length) structured.iterations = this.iterations.value;
    fd.append('structuredData', JSON.stringify(structured));
    // file
    if (val.file) fd.append('file', val.file, val.file.name);
    return fd;
  }

  upload() {
    // prepare list of files to send (one per artifactFields entry)
    const filesToSend = this.artifactFields.controls
      .map((c, idx) => ({ ctrl: c, idx }))
      .filter(x => !!x.ctrl.value?.file);
    if (!filesToSend.length) {
      this.errorMessage = 'Selecciona al menos un archivo para subir';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.uploading = true;
    this.uploadProgress = 0;

    const sendNext = (i: number) => {
      if (i >= filesToSend.length) {
        this.uploading = false;
        this.successMessage = 'Subida(s) finalizada(s) correctamente';
        this.form.reset({ phase: this.currentPhase, date: new Date().toISOString(), isMandatory: false });
        this.createArtifactFieldsForPhase();
        while (this.testCases.length) this.testCases.removeAt(0);
        while (this.iterations.length) this.iterations.removeAt(0);
        this.loadArtifacts();
        return;
      }

      const { idx } = filesToSend[i];
      const fd = this.buildFormDataForIndex(idx);
      this.svc.uploadArtifact(fd).pipe(
        finalize(() => {
          // continue regardless of success/error
        })
      ).subscribe({
        next: (event) => {
          if (!event) return;
          if ((event as any).type === 1) {
            const e: any = event;
            if (e.total) this.uploadProgress = Math.round(100 * e.loaded / e.total);
          } else if ((event as any).type === 4) {
            const body = (event as any).body;
            // append success message
            this.successMessage = (this.successMessage ? this.successMessage + '\n' : '') + (body?.message || `Archivo ${idx + 1} subido`);
            // after successful upload of this file, proceed to next
            sendNext(i + 1);
          }
        },
        error: (err) => {
          console.error('Error subiendo archivo', err);
          this.errorMessage = err?.error?.data || 'Error subiendo artefacto';
          // proceed to next file despite error
          sendNext(i + 1);
        }
      });
    };

    sendNext(0);
  }

  // Upload a single artifact row by index (called from table row)
  uploadSingle(index: number) {
    const ctrl = this.artifactFields.at(index);
    const val = ctrl.value;
    if (!val || !val.file) {
      this.errorMessage = 'Selecciona un archivo en la fila antes de subir.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.uploading = true;
    this.uploadProgress = 0;

    const fd = this.buildFormDataForIndex(index);
    this.svc.uploadArtifact(fd).pipe(finalize(() => {
      // reset uploading flag handled below in complete/error
    })).subscribe({
      next: (event) => {
        if (!event) return;
        if ((event as any).type === 1) {
          const e: any = event;
          if (e.total) this.uploadProgress = Math.round(100 * e.loaded / e.total);
        } else if ((event as any).type === 4) {
          const body = (event as any).body;
          this.successMessage = body?.message || 'Archivo subido';
          // clear the file from this row so it can be re-used
          ctrl.patchValue({ file: null });
          // if this row was in edit mode, exit edit mode
          this.editingRows.delete(index);
          // refresh list
          this.loadArtifacts();
          this.uploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (err) => {
        console.error('Error subiendo archivo (fila):', err);
        this.errorMessage = err?.error?.data || 'Error subiendo archivo';
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  // Editing helpers: show/hide form fields per row
  isEditing(index: number): boolean {
    return this.editingRows.has(index);
  }

  startEdit(index: number) {
    this.enterEdit(index);
  }

  cancelEdit(index: number) {
    this.exitEdit(index);
  }

  toggleEdit(index: number) {
    if (this.isEditing(index)) this.exitEdit(index);
    else this.enterEdit(index);
  }

  private enterEdit(index: number) {
    this.editingRows.add(index);
    const type = this.artifactFields.at(index).value.artifactType;
    const curWf = this.getLatestWorkflowIdForType(type);
    if (curWf) {
      this.selectedWorkflowByType[type] = curWf;
      const curState = this.getLatestStateForType(type);
      if (curState) this.selectedStateByType[type] = curState;
    }
  }

  private exitEdit(index: number) {
    this.editingRows.delete(index);
  }

  getLatestAuthorForType(type: string): string | undefined {
    const art = this.getLatestArtifactOfType(type);
    return art ? (art.author || undefined) : undefined;
  }

  // HU-012 helpers
  getLatestWorkflowIdForType(type: string): string | undefined {
    const art = this.getLatestArtifactOfType(type);
    return art ? (art.currentWorkflowId || art.workflowId) : undefined;
  }

  getLatestStateForType(type: string): string {
    const art = this.getLatestArtifactOfType(type);
    return art ? (art.currentState || art.status || 'Pendiente') : 'Sin Subir';
  }

  getWorkflowNameById(id?: string): string {
    if (!id) return '-';
    const wf = this.workflows.find(w => w._id === id);
    return wf?.name || '-';
  }

  getStatesForWorkflow(id?: string): string[] {
    if (!id) return [];
    const wf = this.workflows.find(w => w._id === id);
    const states: any[] = wf?.states || [];
    return Array.isArray(states) ? states.map((s: any) => (s?.name ?? String(s))).filter(Boolean) : [];
  }

  onWorkflowSelect(type: string, wfId: string) {
    this.selectedWorkflowByType[type] = wfId;
    // Preselect first state when selecting a workflow
    const states = this.getStatesForWorkflow(wfId);
    if (states.length) this.selectedStateByType[type] = states[0];
  }

  assignWorkflowForType(type: string) {
    const latest = this.getLatestArtifactOfType(type);
    if (!latest) { this.errorMessage = 'No hay versión del artefacto para asignar flujo.'; return; }
    const wfId = this.selectedWorkflowByType[type] || this.getLatestWorkflowIdForType(type);
    if (!wfId) { this.errorMessage = 'Selecciona un flujo antes de asignar.'; return; }
    const initialState = this.selectedStateByType[type] || this.getStatesForWorkflow(wfId)[0] || '';
    this.svc.updateArtifactState(latest._id, { workflowId: wfId, state: initialState }).subscribe({
      next: () => this.loadArtifacts(),
      error: () => this.errorMessage = 'No se pudo asignar el flujo'
    });
  }

  onStateSelect(type: string, stateName: string) {
    this.selectedStateByType[type] = stateName;
  }

  updateStateForType(type: string) {
    const latest = this.getLatestArtifactOfType(type);
    if (!latest) { this.errorMessage = 'No hay versión del artefacto para cambiar estado.'; return; }
    const newState = this.selectedStateByType[type];
    if (!newState) { this.errorMessage = 'Selecciona un estado.'; return; }
    this.svc.updateArtifactState(latest._id, { state: newState, assignedTo: [] }).subscribe({
      next: () => this.loadArtifacts(),
      error: () => this.errorMessage = 'No se pudo cambiar el estado'
    });
  }

  hasLatestArtifact(type: string): boolean {
    return !!this.getLatestArtifactOfType(type);
  }

  // return the filename provided by backend or extract from filePath
  public getFilenameFromArtifact(art: any): string | undefined {
    if (!art) return undefined;
    if (art.filename) return art.filename;
    if (art.fileName) return art.fileName;
    // try other common keys
    if (art.originalName) return art.originalName;
    // extract from filePath if available
    const fp = art.filePath || art.path || art.url;
    if (typeof fp === 'string') {
      const parts = fp.split(/\\|\//);
      return parts.length ? parts[parts.length - 1] : undefined;
    }
    return undefined;
  }

  getLatestFilenameForType(type: string): string | undefined {
    const art = this.getLatestArtifactOfType(type);
    return art ? this.getFilenameFromArtifact(art) : undefined;
  }

  // modal helpers
  openModal(index: number) {
    const ctrl = this.artifactFields.at(index);
    // try to preload with the latest uploaded artifact for this type, if any
    const latest = this.getLatestArtifactOfType(ctrl.value.artifactType);
    const defaultAuthor = latest?.author || ctrl.value.author || this.form.value.author || '';
    const defaultIsMandatory = (latest && typeof latest.isMandatory !== 'undefined') ? !!latest.isMandatory : !!ctrl.value.isMandatory;
    const defaultPrototype = latest?.prototypeLink || ctrl.value.prototypeLink || '';
    const defaultExternal = latest?.externalLink || ctrl.value.externalLink || '';
    const defaultTags = Array.isArray(latest?.tags) ? (latest.tags as string[]).join(', ') : (ctrl.value.tags || '');

    // initialize modal form with existing or default values
    this.rowEditForm = this.fb.group({
      file: [null],
      author: [defaultAuthor],
      isMandatory: [defaultIsMandatory],
      prototypeLink: [defaultPrototype],
      externalLink: [defaultExternal],
      tags: [defaultTags],
      observations: ['']
    });
    this.modalIndex = index;
  }

  closeModal() {
    this.modalIndex = null;
    this.rowEditForm = null;
    // clear any temporary file kept in artifactFields row if present
  }

  onModalFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length && this.modalIndex !== null) {
      const f = input.files[0];
      // set file on both modal form and artifactFields ctrl so uploadSingle finds it
      this.rowEditForm?.patchValue({ file: f });
      const ctrl = this.artifactFields.at(this.modalIndex);
      ctrl.patchValue({ file: f });
    }
  }

  submitModal() {
    if (this.modalIndex === null || !this.rowEditForm) return;
    const idx = this.modalIndex;
    const ctrl = this.artifactFields.at(idx);
    // copy values from modal to the row control (except file already set on file change)
    const vals = this.rowEditForm.value;
    ctrl.patchValue({
      author: vals.author,
      isMandatory: vals.isMandatory,
      prototypeLink: vals.prototypeLink,
      externalLink: vals.externalLink,
      tags: vals.tags,
      observations: vals.observations
    });
    // ensure file exists
    if (!ctrl.value.file) {
      this.errorMessage = 'Selecciona un archivo en el modal antes de enviar.';
      return;
    }
    // ensure observations provided (required when creating new version)
    if (!vals.observations || !String(vals.observations).trim()) {
      this.errorMessage = 'Describe los cambios en el campo "Observaciones" antes de subir una nueva versión.';
      return;
    }
    // Close modal and upload
    this.closeModal();
    this.uploadSingle(idx);
  }

  // History modal: open list of versions for artifact type in current phase
  openHistory(index: number) {
    const type = this.artifactFields.at(index).value.artifactType;
    // filter artifacts by type and phase and sort by version descending
    const list = this.artifacts
      .filter(a => a.artifactType === type && a.phase === this.currentPhase)
      .slice()
      .sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
    this.historyList = list;
    this.historyModalIndex = index;
    this.compareSelection = [];
  }

  closeHistory() {
    this.historyModalIndex = null;
    this.historyList = [];
    this.compareSelection = [];
  }

  toggleCompareSelection(i: number) {
    const idx = this.compareSelection.indexOf(i);
    if (idx >= 0) {
      this.compareSelection.splice(idx, 1);
      return;
    }
    if (this.compareSelection.length >= 2) {
      // keep only last two selected
      this.compareSelection.shift();
    }
    this.compareSelection.push(i);
  }

  getComparison(): { a?: any, b?: any } {
    if (this.compareSelection.length === 0) return {};
    const a = this.historyList[this.compareSelection[0]];
    const b = this.historyList[this.compareSelection[1]];
    return { a, b };
  }

  // download helper - returns the backend file path/url as-is
  getDownloadUrl(art: any): string | null {
    if (!art) return null;
    return art.filePath || art.url || null;
  }

  // Generate a PDF with the history list for the currently opened history modal
  generateHistoryPdf() {
    if (!this.historyList || !this.historyList.length || this.historyModalIndex === null) return;
    try {
      const artifactType = this.artifactFields.at(this.historyModalIndex || 0).value.artifactType || 'artifact';
      const doc = new jsPDF();
      const title = `Historial - ${artifactType}`;
      doc.setFontSize(14);
      doc.text(title, 14, 20);

      const head = [['Versión', 'Archivo', 'Autor', 'Fecha', 'Observaciones']];
      const body = this.historyList.map(h => [
        `v${h.version}`,
        this.getFilenameFromArtifact(h) || '-',
        h.author || '-',
        h.date || h.createdAt || '-',
        (h.observations || '-').toString().replace(/\s+/g, ' ')
      ]);

      (autoTable as any)(doc, {
        startY: 28,
        head: head,
        body: body,
        styles: { fontSize: 9 }
      });

      const safeName = artifactType.replace(/[^a-z0-9_\-]+/ig, '_');
      const filename = `${safeName}_historial.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generando PDF de historial:', err);
      this.errorMessage = 'No se pudo generar el PDF del historial.';
    }
  }

  loadArtifacts() {
    if (!this.projectId) {
      console.warn('loadArtifacts: no projectId set yet');
      this.artifacts = [];
      this.allProjectArtifacts = [];
      return;
    }
    this.isLoadingArtifacts = true;

    // Load artifacts for current phase
    this.svc.getArtifacts(this.projectId, this.currentPhase).subscribe({
      next: (res: any) => {
        // Support multiple API response shapes used by backend:
        // - { Result: [...] }
        // - { result: [...] }
        // - { artifacts: [...] } or { data: [...] }
        // - direct array response
        const list = res?.Result || res?.result || res?.artifacts || res?.data || res;
        this.artifacts = Array.isArray(list) ? list : [];
        if (!Array.isArray(list)) {
          console.warn('loadArtifacts: unexpected response shape, assigned empty array', res);
        }
        
        // HU-020: Load ALL project artifacts (all phases) to detect moved artifacts
        this.loadAllProjectArtifacts();
        
        // HU-020: Recreate artifact fields to include uploaded types (for moved artifacts)
        this.createArtifactFieldsForPhase();
        
        // HU-022: Load builds counts for all artifacts
        this.loadBuildsCountsForCurrentPhase();
        
        this.isLoadingArtifacts = false;
      },
      error: (err) => {
        console.error('Error loading artifacts:', err);
        this.isLoadingArtifacts = false;
      }
    });
  }

  // HU-020: Load all artifacts from all phases to detect movements
  private loadAllProjectArtifacts() {
    if (!this.projectId) return;
    
    // Load artifacts without phase filter (backend should support this)
    this.svc.getArtifacts(this.projectId, '').subscribe({
      next: (res: any) => {
        const list = res?.Result || res?.result || res?.artifacts || res?.data || res;
        this.allProjectArtifacts = Array.isArray(list) ? list : [];
        console.log(`📦 Loaded ${this.allProjectArtifacts.length} total artifacts from all phases`);
      },
      error: (err) => {
        console.error('Error loading all project artifacts:', err);
        this.allProjectArtifacts = [];
      }
    });
  }


  // mark artifact state locally (could be done through API in next iteration)
  setArtifactStatus(artifactId: string, status: 'Pendiente' | 'En revisión' | 'Aprobado') {
    const payload = { _id: artifactId, newVersionData: { status } };
    this.svc.updateArtifactVersion(payload).subscribe({ next: () => this.loadArtifacts() });
  }

  // Check if all required artifacts for currentPhase exist and approved/at least present for moving forward
  canProceedToNextPhase(): boolean {
    const required = this.requiredArtifactsMap[this.currentPhase] || [];
    // check presence (at least one artifact of each required type)
    const presentTypes = new Set(this.artifacts.map(a => a.artifactType));
    const missingRequired = required.filter(r => !presentTypes.has(r));
    // return missingRequired.length === 0;
    return true;
  }

  // return latest artifact entry (highest version) for given type in current phase
  public getLatestArtifactOfType(type: string) {
    const list = this.artifacts.filter(a => a.artifactType === type && a.phase === this.currentPhase);
    if (!list.length) return undefined;
    // assume numeric version or convertible
    return list.reduce((best, cur) => {
      const bv = Number(best.version) || 0;
      const cv = Number(cur.version) || 0;
      return cv > bv ? cur : best;
    }, list[0]);
  }

  // HU-020: Get artifact in any phase (for checking if moved)
  private getArtifactInAnyPhase(type: string): any {
    // Search in all loaded artifacts, not just current phase
    const allArtifacts = this.allProjectArtifacts.filter(a => a.artifactType === type);
    if (!allArtifacts.length) return undefined;
    return allArtifacts.reduce((best, cur) => {
      const bv = Number(best.version) || 0;
      const cv = Number(cur.version) || 0;
      return cv > bv ? cur : best;
    }, allArtifacts[0]);
  }

  // HU-020: Check if artifact was moved to another phase
  wasArtifactMoved(type: string): boolean {
    const predefinedTypes = this.requiredArtifactsMap[this.currentPhase] || [];
    // Only predefined types can be "moved away"
    if (!predefinedTypes.includes(type)) return false;
    
    // Check if artifact exists in current phase
    const inCurrentPhase = this.artifacts.some(a => a.artifactType === type && a.phase === this.currentPhase);
    if (inCurrentPhase) return false;
    
    // Check if exists in other phases
    const inOtherPhase = this.allProjectArtifacts.some(a => a.artifactType === type && a.phase !== this.currentPhase);
    return inOtherPhase;
  }

  // HU-020: Get the phase where artifact was moved to
  getMovedToPhase(type: string): string | null {
    const artifact = this.getArtifactInAnyPhase(type);
    if (!artifact || artifact.phase === this.currentPhase) return null;
    return artifact.phase;
  }

  getLatestStatusForType(type: string): string {
    // Keep for compatibility; now prefer currentState
    const art = this.getLatestArtifactOfType(type);
    return art ? (art.currentState || art.status || 'Pendiente') : 'Pendiente';
  }

  getLatestVersionForType(type: string): number | undefined {
    const art = this.getLatestArtifactOfType(type);
    return art ? (Number(art.version) || undefined) : undefined;
  }

  // HU-020: Check if artifact type was moved from another phase (not in predefined list)
  isMovedArtifactType(type: string): boolean {
    const predefinedTypes = this.requiredArtifactsMap[this.currentPhase] || [];
    return !predefinedTypes.includes(type);
  }

  // HU-020: Get filename of moved artifact (from any phase)
  getMovedArtifactFilename(type: string): string {
    const artifact = this.getArtifactInAnyPhase(type);
    return artifact ? (this.getFilenameFromArtifact(artifact) || '-') : '-';
  }

  // HU-020: Get author of moved artifact
  getMovedArtifactAuthor(type: string): string {
    const artifact = this.getArtifactInAnyPhase(type);
    return artifact?.author || '-';
  }

  // HU-020: Get version of moved artifact
  getMovedArtifactVersion(type: string): number | undefined {
    const artifact = this.getArtifactInAnyPhase(type);
    return artifact ? (Number(artifact.version) || undefined) : undefined;
  }


  previousPhase(): void {
    // solo retrocede si no estamos en la primera fase
    if (this.currentPhaseIndex > 0) {
      this.currentPhaseIndex--;
      this.currentPhase = this.phases[this.currentPhaseIndex];
      this.form.patchValue({ phase: this.currentPhase });
      // rebuild per-type fields for the new phase
      this.createArtifactFieldsForPhase();
      this.loadArtifacts();
    }
  }

  proceedToNextPhase() {
    if (!this.canProceedToNextPhase()) {
      this.errorMessage = 'Faltan artefactos obligatorios para completar la fase';
      return;
    }

    if (this.currentPhaseIndex < this.phases.length - 1) {
      this.currentPhaseIndex++;
      this.currentPhase = this.phases[this.currentPhaseIndex];
      this.form.patchValue({ phase: this.currentPhase });
      // rebuild per-type fields for the new phase
      this.createArtifactFieldsForPhase();
      this.loadArtifacts();
      this.successMessage = `Se cambió a fase: ${this.currentPhase}`;
    }
  }

  goToProjects() {
    // clear active project and navigate back
    this.activeProject.setActiveProject(null);
    this.projectId = '';
    this.router.navigate(['/']);
  }

  // Quality Management Integration
  openQualityForArtifact(artifactType: string) {
    const artifact = this.getLatestArtifactOfType(artifactType);
    if (!artifact) {
      this.errorMessage = 'No hay artefacto subido para gestionar calidad';
      return;
    }
    
    this.selectedArtifactForQuality = {
      ...artifact,
      artifactType: artifactType,
      projectId: this.projectId
    };
    this.showQualitySection = true;
  }

  closeQualitySection() {
    this.showQualitySection = false;
    this.selectedArtifactForQuality = null;
  }

  // HU-020: Open reassign modal for an artifact
  openReassignModal(index: number) {
    this.reassignModalIndex = index;
    this.reassignTargetPhase = null;
    this.reassignReason = '';
    this.movementHistory = [];
    this.showMovementHistory = false;
    
    // Load movement history
    const artifact = this.getArtifactAtIndex(index);
    if (artifact?._id) {
      this.svc.getArtifactMovementHistory(artifact._id).subscribe({
        next: (res: any) => {
          if (res?.status === 200) {
            this.movementHistory = res.data || [];
          }
        },
        error: (err) => console.error('Error loading movement history:', err)
      });
    }
  }

  // HU-020: Close reassign modal
  closeReassignModal() {
    this.reassignModalIndex = null;
    this.reassignTargetPhase = null;
    this.reassignReason = '';
    this.movementHistory = [];
    this.showMovementHistory = false;
  }

  // HU-020: Toggle movement history visibility
  toggleMovementHistory() {
    this.showMovementHistory = !this.showMovementHistory;
  }

  // HU-020: Get available phases for reassignment (exclude current phase)
  getAvailablePhases(): Phase[] {
    return this.phases.filter(p => p !== this.currentPhase);
  }

  // HU-020: Perform artifact reassignment
  performReassignment() {
    if (this.reassignModalIndex === null || !this.reassignTargetPhase) {
      this.errorMessage = 'Debe seleccionar una fase destino';
      return;
    }

    const artifact = this.getArtifactAtIndex(this.reassignModalIndex);
    if (!artifact?._id) {
      this.errorMessage = 'No se encontró el artefacto';
      return;
    }

    // Get user ID (adjust based on your auth implementation)
    const userId = sessionStorage.getItem('userId') || 'anonymous';

    if (!this.reassignReason.trim()) {
      this.errorMessage = 'Debe proporcionar una razón para el movimiento';
      return;
    }

    // Show confirmation dialog
    const confirmMsg = `¿Está seguro de mover "${artifact.artifactType}" desde "${this.currentPhase}" hacia "${this.reassignTargetPhase}"?\n\nRazón: ${this.reassignReason}`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.isReassigning = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.svc.reassignArtifactPhase(artifact._id, this.reassignTargetPhase, userId, this.reassignReason).subscribe({
      next: (res: any) => {
        this.isReassigning = false;
        
        if (res?.status === 200) {
          this.successMessage = `Artefacto movido exitosamente a ${this.reassignTargetPhase}`;
          this.closeReassignModal();
          
          // Reload artifacts to reflect the change
          this.loadArtifacts();
        } else if (res?.requiresConfirmation) {
          // Handle validation warnings
          const warningMsg = `${res.message}\n\nAdvertencias:\n${(res.warnings || []).join('\n')}\n\n¿Desea continuar?`;
          if (confirm(warningMsg)) {
            // Retry with force flag (if backend supports it)
            this.performReassignmentWithForce();
          }
        } else {
          this.errorMessage = res?.message || 'Error al reasignar artefacto';
        }
      },
      error: (err) => {
        this.isReassigning = false;
        this.errorMessage = err?.error?.message || 'Error al reasignar artefacto';
        console.error('Reassignment error:', err);
      }
    });
  }

  // HU-020: Force reassignment (bypass warnings)
  performReassignmentWithForce() {
    // Implementation would include force parameter in the API call
    // For now, just show message
    this.errorMessage = 'La reasignación forzada requiere permisos adicionales';
  }

  // Helper: Get artifact at specific index in current view
  private getArtifactAtIndex(index: number): any | null {
    const field = this.artifactFields.at(index);
    if (!field) return null;
    
    const type = field.value.artifactType;
    const artifacts = this.artifacts.filter(
      a => a.artifactType === type && a.phase === this.currentPhase
    );
    
    return artifacts.length > 0 ? artifacts[0] : null;
  }

  // For Transition: validate checklist before closing
  validateTransitionAndClose() {
    if (this.currentPhase !== 'Transición') {
      this.errorMessage = 'Validación de cierre solo aplicable en Transición';
      return;
    }
    const required = this.requiredArtifactsMap['Transición'].filter((rt: string) => {
      const art = this.getLatestArtifactOfType(rt);
      return art?.isMandatory;
    });
    const missing = required.filter((rt: string) => !this.hasLatestArtifact(rt));
    if (missing.length > 0) {
      alert(`Faltan artefactos obligatorios de Transición:\n${missing.join('\n')}`);
      return;
    }
    alert('Transición validada. El proyecto puede cerrarse.');
  }

  // ==================== HU-022: BUILDS MANAGEMENT ====================

  // Open builds modal for artifact
  openBuildsModal(index: number) {
    this.buildsModalIndex = index;
    const artifactType = this.artifactFields.at(index).value.artifactType;
    const artifact = this.getLatestArtifactOfType(artifactType);
    
    if (artifact && artifact._id) {
      this.loadBuildsForArtifact(artifact._id);
    }
    
    // Load project repository URL
    this.loadProjectRepository();
    
    // Reset new build form
    this.resetNewBuildForm();
  }

  // Close builds modal
  closeBuildsModal() {
    this.buildsModalIndex = null;
    this.buildsList = [];
    this.resetNewBuildForm();
  }

  // Load builds for artifact
  loadBuildsForArtifact(artifactId: string) {
    this.buildService.getBuildsForArtifact(artifactId).subscribe({
      next: (response) => {
        if (response && response.Result) {
          this.buildsList = response.Result.builds || [];
          console.log(`Loaded ${this.buildsList.length} builds for artifact`);
        }
      },
      error: (err) => {
        console.error('Error loading builds:', err);
        this.errorMessage = 'Error al cargar builds';
      }
    });
  }

  // Load project repository info
  loadProjectRepository() {
    if (!this.projectId) return;
    
    this.svc.getProject(this.projectId).subscribe({
      next: (response) => {
        console.log('Project response for repository:', response);
        if (response && response.Result) {
          // repositoryUrl is in the Result object along with other project fields
          const project = response.Result;
          this.projectRepositoryUrl = project.repositoryUrl || project.repository_url || null;
          console.log('Repository URL loaded:', this.projectRepositoryUrl);
        }
      },
      error: (err) => {
        console.error('Error loading project repository:', err);
      }
    });
  }

  // Register new build
  registerBuild() {
    if (!this.newBuild.buildId || this.buildsModalIndex === null) {
      this.errorMessage = 'Build ID es requerido';
      return;
    }

    const artifactType = this.artifactFields.at(this.buildsModalIndex).value.artifactType;
    const artifact = this.getLatestArtifactOfType(artifactType);
    
    if (!artifact || !artifact._id) {
      this.errorMessage = 'No se pudo obtener el artefacto';
      return;
    }

    this.isRegisteringBuild = true;

    const buildData = {
      projectId: this.projectId,
      buildId: this.newBuild.buildId,
      commitHash: this.newBuild.commitHash || undefined,
      buildDate: this.newBuild.buildDate || new Date().toISOString(),
      status: this.newBuild.status as 'success' | 'failure' | 'pending' | 'in_progress',
      logs: this.newBuild.logs || undefined,
      artifactId: artifact._id
    };

    this.buildService.registerBuild(buildData).subscribe({
      next: (response) => {
        this.isRegisteringBuild = false;
        if (response && response.intCode === 200) {
          this.successMessage = 'Build registrado exitosamente';
          this.resetNewBuildForm();
          // Reload builds list
          this.loadBuildsForArtifact(artifact._id);
          // Update builds count cache
          this.buildsCountCache[artifactType] = (this.buildsCountCache[artifactType] || 0) + 1;
        } else {
          this.errorMessage = response?.data || 'Error al registrar build';
        }
      },
      error: (err) => {
        this.isRegisteringBuild = false;
        this.errorMessage = err?.error?.data || 'Error al registrar build';
        console.error('Error registering build:', err);
      }
    });
  }

  // Reset new build form
  resetNewBuildForm() {
    this.newBuild = {
      buildId: '',
      commitHash: '',
      status: 'success',
      buildDate: '',
      logs: ''
    };
  }

  // Show build logs in alert (or could open another modal)
  showBuildLogs(build: any) {
    alert(`Logs del build ${build.buildId}:\n\n${build.logs}`);
  }

  // Load builds counts for all artifacts in current phase
  loadBuildsCountsForCurrentPhase() {
    // Clear cache
    this.buildsCountCache = {};
    
    // Get unique artifact types with their latest artifact IDs
    const artifactTypes = this.artifactFields.controls.map(ctrl => ctrl.value.artifactType);
    
    artifactTypes.forEach(type => {
      const artifact = this.getLatestArtifactOfType(type);
      if (artifact && artifact._id) {
        this.buildService.getBuildsForArtifact(artifact._id).subscribe({
          next: (response) => {
            if (response && response.Result) {
              this.buildsCountCache[type] = (response.Result.builds || []).length;
            }
          },
          error: (err) => {
            console.error(`Error loading builds count for ${type}:`, err);
            this.buildsCountCache[type] = 0;
          }
        });
      }
    });
  }

  // Get builds count for artifact type
  getBuildsCountForType(artifactType: string): number {
    return this.buildsCountCache[artifactType] || 0;
  }
}