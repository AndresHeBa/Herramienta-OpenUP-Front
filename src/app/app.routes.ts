import { Routes } from '@angular/router';
import { VentanaCreacionComponent } from './ventana-creacion/ventana-creacion.component';
import { ArtifactUploaderComponent } from './artifact-uploader/artifact-uploader.component';
import { ManageArtifactTypesComponent } from './manage-artifact-types/manage-artifact-types.component';

export const routes: Routes = [
	{ path: '', component: VentanaCreacionComponent },
	{ path: 'artifacts', component: ArtifactUploaderComponent },
	{ path: 'artifacts/:projectId', component: ArtifactUploaderComponent },
	{ path: 'artifact-types', component: ManageArtifactTypesComponent },
	// fallback
	{ path: '**', redirectTo: '' }
];
