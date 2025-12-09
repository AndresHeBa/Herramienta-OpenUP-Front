import { Routes } from '@angular/router';
import { VentanaCreacionComponent } from './ventana-creacion/ventana-creacion.component';
import { ArtifactUploaderComponent } from './artifact-uploader/artifact-uploader.component';
import { ManageArtifactTypesComponent } from './manage-artifact-types/manage-artifact-types.component';
import { MicroincrementListComponent } from './microincrement-list/microincrement-list.component';
import { AssociateWorkflowsComponent } from './associate-workflows/associate-workflows.component';
import { ManagePermissionsComponent } from './manage-permissions/manage-permissions.component';
import { LoginComponent } from './login/login.component';
import { QualityManagementComponent } from './quality-management/quality-management.component';
import { AdminConfigurationComponent } from './admin-configuration/admin-configuration.component';

export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
    { path: 'microincrements', component: MicroincrementListComponent },
	{ path: 'ventana-creacion', component: VentanaCreacionComponent },
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'artifacts', component: ArtifactUploaderComponent },
	{ path: 'artifacts/:projectId', component: ArtifactUploaderComponent },
	{ path: 'artifact-types', component: ManageArtifactTypesComponent },
	{ path: 'associate-workflows', component: AssociateWorkflowsComponent },
	{ path: 'manage-permissions', component: ManagePermissionsComponent },
	{ path: 'quality-management', component: QualityManagementComponent },
	{ path: 'admin-configuration', component: AdminConfigurationComponent },
	// fallback
	{ path: '**', redirectTo: 'login' }
];
