import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-tab-bloqueada',
  imports: [MaterialModule],
  templateUrl: './tab-bloqueada.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBloqueadaComponent {}
