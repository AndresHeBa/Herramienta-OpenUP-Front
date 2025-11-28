import { Component } from '@angular/core';
import { VentanaCreacionComponent } from "./ventana-creacion/ventana-creacion.component";
import { ArtifactUploaderComponent } from "./artifact-uploader/artifact-uploader.component";

@Component({
  selector: 'app-root',
  imports: [VentanaCreacionComponent, ArtifactUploaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'OpenUP';
}
