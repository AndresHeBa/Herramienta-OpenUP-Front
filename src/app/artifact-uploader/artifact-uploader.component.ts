import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ArtifactService } from '../service/artifact.service';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

type Phase = 'Incepción' | 'Elaboración' | 'Construcción' | 'Transición';

@Component({
  selector: 'app-artifact-uploader',
  templateUrl: './artifact-uploader.component.html',
  styleUrls: ['./artifact-uploader.component.css'],
  imports: [ ReactiveFormsModule, CommonModule]
})
export class ArtifactUploaderComponent implements OnInit {
  form: FormGroup;
  projectId = 'P-001'; // Podría venir de ruta/estado
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
  uploadProgress = 0;
  uploading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private svc: ArtifactService) {
    this.form = this.fb.group({
      artifactType: ['', Validators.required],
      phase: [this.currentPhase, Validators.required],
      author: ['', Validators.required],
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

  ngOnInit(): void {
    this.loadArtifacts();
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

  buildFormData(): FormData {
    const fd = new FormData();
    fd.append('projectId', this.projectId);
    fd.append('phase', this.currentPhase);
    fd.append('artifactType', this.form.value.artifactType);
    // compute next version for this artifact type in current phase
    const sameType = this.artifacts.filter(a => a.artifactType === this.form.value.artifactType && a.phase === this.currentPhase);
    const maxVersion = sameType.reduce((m, x) => Math.max(m, Number(x.version) || 0), 0);
    const nextVersion = maxVersion + 1;
    fd.append('version', String(nextVersion));
    fd.append('author', this.form.value.author);
    fd.append('date', this.form.value.date);
    fd.append('isMandatory', this.form.value.isMandatory ? 'true' : 'false');
    if (this.form.value.prototypeLink) fd.append('url', this.form.value.prototypeLink);
    if (this.form.value.externalLink) fd.append('externalLink', this.form.value.externalLink);
    const tags: string[] = (this.form.value.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean) as string[];
    if (tags.length) tags.forEach((t: string) => fd.append('tags', t));

    // structured data
    const structured: any = {};
    if (this.testCases.length) structured.testCases = this.testCases.value;
    if (this.iterations.length) structured.iterations = this.iterations.value;
    fd.append('structuredData', JSON.stringify(structured));

    // file
    if (this.form.value.file) fd.append('file', this.form.value.file, this.form.value.file.name);

    return fd;
  }

  upload() {
    if (this.form.invalid) {
      this.errorMessage = 'Completa los campos requeridos';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    const fd = this.buildFormData();

    this.uploading = true;
    this.uploadProgress = 0;

    this.svc.uploadArtifact(fd).pipe(
      finalize(() => this.uploading = false)
    ).subscribe({
      next: (event) => {
        // HttpClient with observe: 'events'
        if (!event) return;
        if ((event as any).type === 1) { // HttpEventType.UploadProgress
          const e: any = event;
          if (e.total) this.uploadProgress = Math.round(100 * e.loaded / e.total);
        } else if ((event as any).type === 4) {
          // final response
          const body = (event as any).body;
          this.successMessage = body?.message || 'Subida finalizada';
          this.form.reset({ phase: this.currentPhase, date: new Date().toISOString(), isMandatory: false });
          // reset arrays
          while (this.testCases.length) this.testCases.removeAt(0);
          while (this.iterations.length) this.iterations.removeAt(0);
          this.loadArtifacts();
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.data || 'Error subiendo artefacto';
      }
    });
  }

  loadArtifacts() {
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
      },
      error: (err) => console.error('Error loading artifacts:', err)
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
    return missingRequired.length === 0;
  }

  // return latest artifact entry (highest version) for given type in current phase
  private getLatestArtifactOfType(type: string) {
    const list = this.artifacts.filter(a => a.artifactType === type && a.phase === this.currentPhase);
    if (!list.length) return undefined;
    // assume numeric version or convertible
    return list.reduce((best, cur) => {
      const bv = Number(best.version) || 0;
      const cv = Number(cur.version) || 0;
      return cv > bv ? cur : best;
    }, list[0]);
  }

  getLatestStatusForType(type: string): string {
    const art = this.getLatestArtifactOfType(type);
    return art ? (art.status || 'Pendiente') : 'Pendiente';
  }

  getLatestVersionForType(type: string): number | undefined {
    const art = this.getLatestArtifactOfType(type);
    return art ? (Number(art.version) || undefined) : undefined;
  }

  
  previousPhase(): void {
    // solo retrocede si no estamos en la primera fase
    if (this.currentPhaseIndex > 0) {
      this.currentPhaseIndex--;
      this.currentPhase = this.phases[this.currentPhaseIndex];
      this.form.patchValue({ phase: this.currentPhase });
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
      this.loadArtifacts();
      this.successMessage = `Se cambió a fase: ${this.currentPhase}`;
    }
  }

  // For Transition: validate checklist before closing
  validateTransitionAndClose() {
    if (this.currentPhase !== 'Transición') {
      this.errorMessage = 'Validación de cierre solo aplicable en Transición';
      return;
    }

    this.svc.validateTransition(this.projectId).subscribe({
      next: (res) => {
        if (res?.status === 200) {
          this.successMessage = 'Proyecto listo para cierre: todos los documentos obligatorios aprobados';
        } else {
          this.errorMessage = res?.data || 'Faltan documentos para cierre';
        }
      },
      error: (err) => { this.errorMessage = err?.error?.data || 'Error validando cierre'; }
    });
  }
}