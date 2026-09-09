import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { GeneralComponent } from './general/general.component';
import { AdminLotesComponent } from './aviso-cobranza/admin-lotes.component';
import { AdminLotesEmisionComponent } from './emision-masiva/admin-lotes.component';

interface TabModuloAdmin {
  id: string;
  label: string;
  habilitado: boolean;
}

@Component({
  selector: 'app-administracion',
  imports: [MaterialModule, GeneralComponent, AdminLotesComponent, AdminLotesEmisionComponent],
  templateUrl: './administracion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracionComponent implements OnInit {

  private readonly menuService = inject(MenuService);

  // Catalogo a nivel sistema (GLO_MODULOS_GESTOR), no el menu del usuario -- quien entra a Administración
  // se asume con acceso a todo lo que el cliente tenga instalado.
  private readonly rutasSistema = signal<ReadonlySet<string>>(new Set());

  // Agregar un modulo nuevo es: sumar una entrada en TODAS_LAS_TABS + su ruta en tieneModulo + su
  // componente en el @switch del template.
  private static readonly TODAS_LAS_TABS: TabModuloAdmin[] = [
    { id: 'general', label: 'Configuraciones Generales', habilitado: true },
    { id: 'avisos-cobranza', label: 'Avisos de Cobranza', habilitado: true },
    { id: 'emision-masiva', label: 'Emisión Masiva', habilitado: true },
    { id: 'html', label: 'HTML', habilitado: false },
  ];

  readonly tabs = computed<TabModuloAdmin[]>(() =>
    AdministracionComponent.TODAS_LAS_TABS.filter(tab => this.tieneModulo(tab.id))
  );

  ngOnInit(): void {
    this.menuService.obtenerRutasSistema().subscribe(rutas => this.rutasSistema.set(new Set(rutas)));
  }

  // "general" y "html" (placeholder "Próximamente") son transversales, no dependen de GLO_MODULOS_GESTOR.
  private tieneModulo(id: string): boolean {
    switch (id) {
      case 'avisos-cobranza':
        return this.rutasSistema().has('/inicio/avisos-cobranza/listar-lotes');
      case 'emision-masiva':
        return this.rutasSistema().has('/inicio/emision-masiva/listar-lotes');
      default:
        return true;
    }
  }
}
