import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { GeneralComponent } from './general/general.component';
import { AdminLotesComponent } from './aviso-cobranza/admin-lotes.component';

interface TabModuloAdmin {
  id: string;
  label: string;
  habilitado: boolean;
}

@Component({
  selector: 'app-administracion',
  imports: [MaterialModule, GeneralComponent, AdminLotesComponent],
  templateUrl: './administracion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracionComponent {

  // Agregar un modulo nuevo es: sumar una entrada acá + su componente en el @switch del template.
  // "general" siempre primero -- configs transversales, no específicas de un módulo.
  readonly tabs: TabModuloAdmin[] = [
    { id: 'general', label: 'Configuraciones Generales', habilitado: true },
    { id: 'avisos-cobranza', label: 'Avisos de Cobranza', habilitado: true },
    { id: 'html', label: 'HTML', habilitado: false },
  ];
}
