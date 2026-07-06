import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
    <a href="/" class="logodark">
      <!--img
        src="./assets/images/logos/dark-logo.svg"
        class="align-middle m-2 rtl:-scale-x-100"
        alt="logo"
      /-->
      
      <img
        src="./assets/images/logos/bigsa-gestor-light.png"
        class="align-middle m-2 rtl:-scale-x-100"
        alt="logo"
        style="width: 200px; height: auto;"
      />
    </a>

    <a href="/" class="logolight">
      <!--img
        src="./assets/images/logos/light-logo.svg"
        class="align-middle m-2 rtl:-scale-x-100"
        alt="logo"
      /-->
      <img
        src="./assets/images/logos/bigsa-gestor-dark.png"
        class="align-middle m-2 rtl:-scale-x-100"
        alt="logo"
        style="width: 200px; height: auto;"
      />
    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) { }
}
