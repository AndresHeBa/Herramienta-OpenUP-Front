import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ArtifactService } from '../service/artifact.service';

@Component({
  selector: 'app-manage-artifact-types',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-artifact-types.component.html',
  styleUrls: ['./manage-artifact-types.component.css']
})
export class ManageArtifactTypesComponent implements OnInit {
  loading = false;
  savingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  artifactTypes: any[] = [];

  constructor(private svc: ArtifactService) {}

  ngOnInit(): void {
    this.loadArtifactTypes();
  }

  loadArtifactTypes() {
    this.loading = true;
    // Prefer the mandatory endpoint which returns phase + isMandatory
    this.svc.getArtifactTypes().subscribe({
      next: (res: any) => {
        const list = res?.Result || res?.result || res?.data || res;
        this.artifactTypes = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading artifact types:', err);
        // fallback: try getArtifactTypes
        this.svc.getArtifactTypes().subscribe({
          next: (r2: any) => {
            const l2 = r2?.Result || r2?.result || r2?.data || r2;
            this.artifactTypes = Array.isArray(l2) ? l2.map((x: any) => ({ ...x, isMandatory: !!x.isMandatory })) : [];
            this.loading = false;
          },
          error: () => { this.loading = false; this.errorMessage = 'No se pudieron cargar los tipos de artefacto'; }
        });
      }
    });
  }

  toggleMandatory(item: any, event?: Event) {
    // If the DOM event is provided, read the checked state; otherwise toggle
    if (event && (event.target as HTMLInputElement)) {
      item.isMandatory = !!((event.target as HTMLInputElement).checked);
    } else {
      item.isMandatory = !item.isMandatory;
    }
  }

  saveItem(item: any) {
    if (!item || !item._id) return;
    this.savingId = item._id;
    this.errorMessage = '';
    this.successMessage = '';
    const payload = { _id: item._id, isMandatory: !!item.isMandatory };
    this.svc.updateArtifactType(payload).subscribe({
      next: (res: any) => {
        this.successMessage = 'Guardado correctamente.';
        this.savingId = null;
      },
      error: (err) => {
        console.error('Error saving artifact type:', err);
        this.errorMessage = 'Error guardando cambios';
        this.savingId = null;
      }
    });
  }

  saveAll() {
    // Use bulk endpoint to update mandatory flags for all artifact types
    this.errorMessage = '';
    this.successMessage = '';
    const updateList = this.artifactTypes.map(it => ({ artifactType: it.artifactType || it.name, isMandatory: !!it.isMandatory }));
    if (!updateList.length) return;
    this.loading = true;
    console.log(updateList);
    this.svc.updateMandatoryStatuses(updateList).subscribe({
      next: (res: any) => {
        console.log(res);
        
        // response expected: { message: ..., updatedTypesCount, errors }
        const updated = res?.updatedTypesCount ?? res?.updatedTypes ?? 0;
        const errors = res?.errors || [];
        this.successMessage = `Bulk update processed. Updated types: ${updated}`;
        if (Array.isArray(errors) && errors.length) {
          this.errorMessage = `Errores: ${errors.join('; ')}`;
        }
        this.loading = false;
        // reload list to reflect server canonical values
        this.loadArtifactTypes();
      },
      error: (err) => {
        console.error('Error performing bulk update:', err);
        this.errorMessage = 'Error en actualización masiva';
        this.loading = false;
      }
    });
  }
}
