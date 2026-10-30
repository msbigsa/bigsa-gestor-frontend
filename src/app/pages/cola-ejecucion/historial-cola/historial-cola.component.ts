import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';

import { MaterialModule } from 'src/app/material.module';
import { ColaEjecucionService } from 'src/app/services/cola-ejecucion/colaEjecucion.service';
import { SolicitudCola } from 'src/app/models/cola-ejecucion/SolicitudCola';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildHistorialColaTourSteps } from '../cola-ejecucion-tour.steps';
import {
  RUTA_COLA_ACTIVA,
  destinoCarga,
  estadoSolicitudClase,
  estadoSolicitudLabel,
  referenciaTexto,
  tooltipEstadoSolicitud,
  usuarioDescripcion,
  usuarioTexto,
} from '../shared/cola-ejecucion.util';

@Component({
  selector: 'app-historial-cola',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './historial-cola.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialColaComponent implements OnInit {

  private readonly colaService = inject(ColaEjecucionService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  private readonly menuService = inject(MenuService);
  private readonly tourService = inject(TourService);

  readonly solicitudes = signal<SolicitudCola[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['#', 'carga', 'usuario', 'estado', 'resultado', 'solicitada', 'inicio', 'fin'];

  readonly estadoLabel = estadoSolicitudLabel;
  readonly estadoClase = estadoSolicitudClase;
  readonly tooltipEstado = tooltipEstadoSolicitud;
  readonly referenciaTexto = referenciaTexto;
  readonly usuarioTexto = usuarioTexto;
  readonly usuarioDescripcion = usuarioDescripcion;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.colaService.listarTerminadas(this.pageIndex(), this.pageSize()).subscribe(data => {
      this.solicitudes.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargar();
  }

  puedeVerColaActiva(): boolean {
    return this.menuService.tieneAcceso(RUTA_COLA_ACTIVA);
  }

  irAColaActiva(): void {
    this.router.navigate([RUTA_COLA_ACTIVA]);
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

  iniciarTour(): void {
    this.tourService.start(buildHistorialColaTourSteps(this.solicitudes().length > 0));
  }

  getFechaCompleta(fecha: string | undefined): string {
    if (!fecha) {
      return '';
    }

    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm") ?? '';
  }
}
