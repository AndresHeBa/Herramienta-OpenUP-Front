import { Routes } from '@angular/router';
import { VentanaCreacionComponent } from './ventana-creacion/ventana-creacion.component';
import { ArtifactUploaderComponent } from './artifact-uploader/artifact-uploader.component';
import { ManageArtifactTypesComponent } from './manage-artifact-types/manage-artifact-types.component';
import { MicroincrementListComponent } from './microincrement-list/microincrement-list.component';
import { AssociateWorkflowsComponent } from './associate-workflows/associate-workflows.component';

export const routes: Routes = [
    { path: 'microincrements', component: MicroincrementListComponent },
	{ path: '', component: VentanaCreacionComponent },
	{ path: 'artifacts', component: ArtifactUploaderComponent },
	{ path: 'artifacts/:projectId', component: ArtifactUploaderComponent },
	{ path: 'artifact-types', component: ManageArtifactTypesComponent },
	{ path: 'associate-workflows', component: AssociateWorkflowsComponent },
	// fallback
	{ path: '**', redirectTo: '' }
];
