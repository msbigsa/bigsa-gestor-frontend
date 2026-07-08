import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxUiLoaderModule } from 'ngx-ui-loader';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgxUiLoaderModule
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Bigsa Gestor';

}
