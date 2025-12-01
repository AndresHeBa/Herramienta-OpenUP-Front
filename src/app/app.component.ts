import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'OpenUP';
}
