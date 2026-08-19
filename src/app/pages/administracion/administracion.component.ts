import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { AdminLotesComponent } from './aviso-cobranza/admin-lotes.component';

interface TabModuloAdmin {
  id: string;
  label: string;
  habilitado: boolean;
}

@Component({
  selector: 'app-administracion',
  imports: [MaterialModule, AdminLotesComponent],
  templateUrl: './administracion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracionComponent {

  // Agregar un modulo nuevo es: sumar una entrada acá + su componente en el @switch del template.
  readonly tabs: TabModuloAdmin[] = [
    { id: 'avisos-cobranza', label: 'Avisos de Cobranza', habilitado: true },
    { id: 'html', label: 'HTML', habilitado: false },
  ];
}
