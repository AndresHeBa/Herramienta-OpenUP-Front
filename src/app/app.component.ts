import { Component } from '@angular/core';
import { VentanaCreacionComponent } from "./ventana-creacion/ventana-creacion.component";

@Component({
  selector: 'app-root',
  imports: [VentanaCreacionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'OpenUP';
}
