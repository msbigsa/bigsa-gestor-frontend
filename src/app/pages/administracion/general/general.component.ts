import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { MaterialModule } from 'src/app/material.module';
import { ConfigsService } from 'src/app/services/configs.service';
import { NotificacionService } from 'src/app/services/notifica/notificacion.service';

@Component({
  selector: 'app-general',
  imports: [MaterialModule],
  templateUrl: './general.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent implements OnInit {

  private readonly configsService = inject(ConfigsService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly toastr = inject(ToastrService);

  readonly usaNotificacion = signal(false);
  readonly guardando = signal(false);

  ngOnInit(): void {
    this.configsService.obtenerConfigs().subscribe(configs => {
      this.usaNotificacion.set(configs.usaNotificacion);
    });
  }

  onUsaNotificacionChange(valor: boolean): void {
    this.guardando.set(true);

    this.configsService.actualizarConfigs({ usaNotificacion: valor }).subscribe({

      next: (configs) => {
        this.usaNotificacion.set(configs.usaNotificacion);
        this.guardando.set(false);

        // El header/campanita usan este mismo signal -- se refleja sin recargar la pagina.
        this.notificacionService.habilitado.set(configs.usaNotificacion);

        if (configs.usaNotificacion) {
          this.notificacionService.start();
        } else {
          this.notificacionService.stop();
        }

        this.toastr.success('Configuración actualizada correctamente', 'Exitoso');
      },

      error: () => {
        this.usaNotificacion.set(!valor);
        this.guardando.set(false);
      }
    });
  }
}
