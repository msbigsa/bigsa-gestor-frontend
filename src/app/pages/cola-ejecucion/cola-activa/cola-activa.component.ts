import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { ColaEjecucionService } from 'src/app/services/cola-ejecucion/colaEjecucion.service';
import { GrupoCola } from 'src/app/models/cola-ejecucion/GrupoCola';
import { SolicitudCola } from 'src/app/models/cola-ejecucion/SolicitudCola';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildColaActivaTourSteps } from '../cola-ejecucion-tour.steps';
import {
  destinoCarga,
  dialogoCancelacion,
  enPausa,
  esReintento,
  motivoNoMovible,
  puedeCancelar,
  rangoPosiciones,
  referenciaTexto,
  usuarioDescripcion,
  usuarioTexto,
} from '../shared/cola-ejecucion.util';

const RUTA_HISTORIAL = '/inicio/cola-ejecucion/historial';

@Component({
  selector: 'app-cola-activa',
  imports: [CommonModule, MaterialModule],
  providers: [DatePipe],
  templateUrl: './cola-activa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColaActivaComponent implements OnInit {

  private readonly colaService = inject(ColaEjecucionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly menuService = inject(MenuService);
  private readonly tourService = inject(TourService);

  readonly grupos = signal<GrupoCola[]>([]);
  readonly cargada = signal(false);
  readonly fechaActualizacion = signal<Date | null>(null);
  // Solicitud a destacar al llegar desde el detalle de una carga (?solicitud=).
  readonly resaltada = signal<string | null>(null);

  readonly gruposConActividad = computed(() =>
    this.grupos().filter(g => g.enEjecucion || g.pendientes.length > 0)
  );
  readonly gruposLibres = computed(() =>
    this.grupos().filter(g => !g.enEjecucion && g.pendientes.length === 0)
  );

  readonly displayedColumns = ['posicion', 'carga', 'usuario', 'fecha', 'estado', 'accion'];

  readonly referenciaTexto = referenciaTexto;
  readonly usuarioTexto = usuarioTexto;
  readonly usuarioDescripcion = usuarioDescripcion;
  readonly esReintento = esReintento;
  readonly enPausa = enPausa;
  readonly motivoNoMovible = motivoNoMovible;
  readonly puedeCancelar = puedeCancelar;

  ngOnInit(): void {
    this.resaltada.set(this.route.snapshot.queryParamMap.get('solicitud'));
    this.cargar();
  }

  // Sin polling: se refresca a pedido.
  cargar(): void {
    this.colaService.consultar().subscribe(cola => {
      this.grupos.set(cola.grupos);
      this.cargada.set(true);
      this.fechaActualizacion.set(new Date());
    });
  }

  esResaltada(solicitud: SolicitudCola): boolean {
    return this.resaltada() === String(solicitud.idSolicitud);
  }

  puedeVerHistorial(): boolean {
    return this.menuService.tieneAcceso(RUTA_HISTORIAL);
  }

  irAHistorial(): void {
    this.router.navigate([RUTA_HISTORIAL]);
  }

  puedeVerCarga(solicitud: SolicitudCola): boolean {
    const destino = destinoCarga(solicitud);
    return !!destino && this.menuService.tieneAcceso(destino.rutaPermiso);
  }

  irACarga(solicitud: SolicitudCola): void {
    const destino = destinoCarga(solicitud);
    if (destino) {
      this.router.navigate([destino.rutaDetalle, solicitud.idCarga]);
    }
  }

  puedeSubir(solicitud: SolicitudCola, grupo: GrupoCola): boolean {
    return !this.motivoNoMovible(solicitud) && solicitud.posicion! > rangoPosiciones(grupo).min;
  }

  puedeBajar(solicitud: SolicitudCola, grupo: GrupoCola): boolean {
    return !this.motivoNoMovible(solicitud) && solicitud.posicion! < rangoPosiciones(grupo).max;
  }

  // Lugares a los que se puede mover, sin el actual.
  posicionesDestino(solicitud: SolicitudCola, grupo: GrupoCola): number[] {
    if (this.motivoNoMovible(solicitud)) {
      return [];
    }

    const { min, max } = rangoPosiciones(grupo);
    const posiciones: number[] = [];
    for (let p = min; p <= max; p++) {
      if (p !== solicitud.posicion) {
        posiciones.push(p);
      }
    }
    return posiciones;
  }

  subir(solicitud: SolicitudCola): void {
    this.moverA(solicitud, solicitud.posicion! - 1);
  }

  bajar(solicitud: SolicitudCola): void {
    this.moverA(solicitud, solicitud.posicion! + 1);
  }

  // Devuelve el grupo ya renumerado.
  moverA(solicitud: SolicitudCola, posicion: number): void {
    this.colaService.reordenar(solicitud.idSolicitud, posicion).subscribe({
      next: grupo => this.grupos.update(grupos => grupos.map(g => (g.grupo === grupo.grupo ? grupo : g))),
      // El interceptor muestra el rechazo; se vuelve a leer la cola.
      error: () => this.cargar(),
    });
  }

  cancelar(solicitud: SolicitudCola): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      disableClose: true,
      data: dialogoCancelacion(solicitud),
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.colaService.cancelar(solicitud.idSolicitud).subscribe({
        next: cancelacion => {
          if (cancelacion.cancelacionPedida) {
            this.toastr.info('Se detendrá después de la fila en curso', 'Cancelación pedida');
          } else {
            this.toastr.success('Salió de la cola', 'Ejecución cancelada');
          }
          this.cargar();
        },
        error: () => this.cargar(),
      });
    });
  }

  iniciarTour(): void {
    const primero = this.gruposConActividad()[0];
    this.tourService.start(buildColaActivaTourSteps(
      !!primero,
      !!primero?.enEjecucion,
      (primero?.pendientes.length ?? 0) > 0,
      this.puedeVerHistorial(),
    ));
  }

  getFechaCompleta(fecha: string | undefined): string {
    if (!fecha) {
      return '';
    }

    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm") ?? '';
  }
}
