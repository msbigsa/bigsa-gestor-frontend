import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, interval, of } from 'rxjs';
import { catchError, exhaustMap, filter } from 'rxjs/operators';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { VidaSaludLoteService } from 'src/app/services/vida-y-salud/vidaSaludLote.service';
import { VidaSaludCompaniaService } from 'src/app/services/vida-y-salud/vidaSaludCompania.service';
import { LoteVidaSaludResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludResponse';
import { EstadoLoteVidaSalud } from 'src/app/models/vida-y-salud/EstadoLoteVidaSalud';
import { CompaniaDisponible } from 'src/app/models/vida-y-salud/CompaniaDisponible';
import {
  estadoLoteClase,
  estadoLoteLabel,
  tooltipEstadoLote,
  tieneErrorLote,
  usuarioTexto,
  usuarioDescripcion,
  tieneFilasFacturadas,
  AVISO_ELIMINAR_FILAS_FACTURADAS,
} from '../shared/estados-vida-salud.util';
import {
  EliminarLoteDialogVidaSaludComponent,
  EliminarLoteDialogData,
} from '../shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildListarLotesTourSteps } from '../vida-y-salud-tour.steps';

const RUTA_CARGAR_LOTE = '/inicio/vida-y-salud/cargar-lote';

@Component({
  selector: 'app-listar-lotes-vida-salud',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './listar-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarLotesVidaSaludComponent implements OnInit {

  private readonly loteService = inject(VidaSaludLoteService);
  private readonly companiaService = inject(VidaSaludCompaniaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuService = inject(MenuService);
  private readonly tourService = inject(TourService);

  private static readonly INTERVALO_POLLING_MS = 5000;
  // Coincide con EstadoLoteVidaSalud.INTERMEDIOS del backend.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteVidaSalud[] =
    [EstadoLoteVidaSalud.VALIDANDO, EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS, EstadoLoteVidaSalud.FACTURANDO];
  // Mismos estados que exige el backend (ESTADOS_FACTURABLES) -- incluye FACTURADO_CON_ERRORES/
  // ERROR_FACTURACION porque el mismo endpoint /facturar sirve para reintentar filas con error.
  private static readonly ESTADOS_FACTURABLES: EstadoLoteVidaSalud[] = [
    EstadoLoteVidaSalud.VALIDADO_OK, EstadoLoteVidaSalud.VALIDADO_CON_ERRORES,
    EstadoLoteVidaSalud.FACTURADO_CON_ERRORES, EstadoLoteVidaSalud.ERROR_FACTURACION,
  ];

  readonly lotes = signal<LoteVidaSaludResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteVidaSalud | null>(null);
  readonly mostrarEliminados = signal(false);

  readonly estadosDisponibles = Object.values(EstadoLoteVidaSalud);

  readonly companias = toSignal(this.companiaService.listarDisponibles(), { initialValue: [] as CompaniaDisponible[] });
  readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.ciasCodigo, c.ciasNombre]))
  );

  readonly displayedColumns: string[] =
    ['#', 'archivo', 'compania', 'fecha', 'usuario', 'estado', 'totalFilas', 'accion'];

  ngOnInit(): void {
    this.leerFiltrosDesdeUrl();
    this.cargarLotes();

    interval(ListarLotesVidaSaludComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.hayLotesEnProceso()),
        exhaustMap(() => this.loteService.listarLotes(
          this.pageIndex(),
          this.pageSize(),
          this.filtroEstado() ?? undefined,
          true,
          this.mostrarEliminados(),
        ).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(data => {
        this.lotes.set(data.content);
        this.totalElements.set(data.totalElements);
      });
  }

  // Para que los filtros/pagina se mantengan al volver de una futura pantalla de detalle.
  private leerFiltrosDesdeUrl(): void {
    const params = this.route.snapshot.queryParamMap;

    const estado = params.get('estado');
    if (estado && (Object.values(EstadoLoteVidaSalud) as string[]).includes(estado)) {
      this.filtroEstado.set(estado as EstadoLoteVidaSalud);
    }

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (params.get('eliminados') === 'true' || this.filtroEstado() === EstadoLoteVidaSalud.ELIMINADO) {
      this.mostrarEliminados.set(true);
    }

    const page = Number(params.get('page'));
    if (page > 0) {
      this.pageIndex.set(page);
    }

    const size = Number(params.get('size'));
    if (size > 0) {
      this.pageSize.set(size);
    }
  }

  private sincronizarQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        estado: this.filtroEstado() ?? null,
        eliminados: this.mostrarEliminados() ? 'true' : null,
        page: this.pageIndex() || null,
        size: this.pageSize() !== 10 ? this.pageSize() : null,
      },
      replaceUrl: true,
    });
  }

  private hayLotesEnProceso(): boolean {
    return this.lotes().some(lote => ListarLotesVidaSaludComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote));
  }

  cargarLotes(silencioso = false): void {
    this.loteService.listarLotes(
      this.pageIndex(),
      this.pageSize(),
      this.filtroEstado() ?? undefined,
      silencioso,
      this.mostrarEliminados(),
    ).subscribe(data => {
      this.lotes.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  onFiltroEstadoChange(estado: EstadoLoteVidaSalud | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (estado === EstadoLoteVidaSalud.ELIMINADO) {
      this.mostrarEliminados.set(true);
    }

    this.cargarLotes();
    this.sincronizarQueryParams();
  }

  onMostrarEliminadosChange(mostrar: boolean): void {
    this.mostrarEliminados.set(mostrar);
    this.pageIndex.set(0);

    this.cargarLotes();
    this.sincronizarQueryParams();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargarLotes();
    this.sincronizarQueryParams();
  }

  irACargarLote(): void {
    this.router.navigate([RUTA_CARGAR_LOTE]);
  }

  verDetalle(lote: LoteVidaSaludResponse): void {
    this.router.navigate(['/inicio/vida-y-salud/listar-lotes/detalle-lote', lote.loteId]);
  }

  irADetalleLote(loteId: number): void {
    this.router.navigate(['/inicio/vida-y-salud/listar-lotes/detalle-lote', loteId]);
  }

  puedeCargarLote(): boolean {
    return this.menuService.tieneAcceso(RUTA_CARGAR_LOTE);
  }

  iniciarTour(): void {
    this.tourService.start(buildListarLotesTourSteps(this.lotes().length > 0, this.puedeCargarLote()));
  }

  // "codigo - nombre": mas facil de ubicar para quienes se guian por el codigo.
  nombreCompania(ciasCodigo: number | undefined): string {
    if (ciasCodigo == null) {
      return '-';
    }

    const nombre = this.nombreCompaniaPorCodigo().get(ciasCodigo);
    return nombre ? `${ciasCodigo} - ${nombre}` : `${ciasCodigo}`;
  }

  puedeValidar(lote: LoteVidaSaludResponse): boolean {
    return (lote.estadoLote === EstadoLoteVidaSalud.CARGADO || lote.estadoLote === EstadoLoteVidaSalud.ERROR_VALIDACION)
      && lote.totalFilas > 0;
  }

  puedeEliminar(lote: LoteVidaSaludResponse): boolean {
    return lote.estadoLote !== EstadoLoteVidaSalud.ELIMINADO;
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  enProceso(lote: LoteVidaSaludResponse): boolean {
    return ListarLotesVidaSaludComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote);
  }

  validar(lote: LoteVidaSaludResponse): void {
    this.loteService.validarLote(lote.loteId).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLotes();
    });
  }

  puedeFacturar(lote: LoteVidaSaludResponse): boolean {
    return ListarLotesVidaSaludComponent.ESTADOS_FACTURABLES.includes(lote.estadoLote);
  }

  // El mismo boton/endpoint sirve para "primera facturacion" y para reintentar -- solo cambia el
  // texto para dejar claro que no es la primera vez.
  esReintentoFacturacion(lote: LoteVidaSaludResponse): boolean {
    return lote.estadoLote === EstadoLoteVidaSalud.FACTURADO_CON_ERRORES || lote.estadoLote === EstadoLoteVidaSalud.ERROR_FACTURACION;
  }

  facturar(lote: LoteVidaSaludResponse): void {
    const esReintento = this.esReintentoFacturacion(lote);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      disableClose: true,
      data: {
        title: esReintento ? 'Reintentar facturación' : 'Facturar lote',
        message: esReintento
          ? `¿Reintentar la facturación del lote #${lote.loteId}? Las filas ya facturadas no se repiten, solo se retoman las pendientes o con error.`
          : `¿Está seguro que desea facturar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esto marca las facturas como definitivas`
            + `${lote.enviaCorreo ? ' y envía los correos de confirmación reales' : ''}.`,
        confirmText: esReintento ? 'Reintentar' : 'Facturar',
        cancelText: 'Cancelar',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.facturarLote(lote.loteId).subscribe(() => {
        this.toastr.info('Facturación de lote iniciada', 'En proceso');
        this.cargarLotes();
      });
    });
  }

  eliminar(lote: LoteVidaSaludResponse): void {
    if (this.enProceso(lote)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Eliminar lote',
        message: `¿Está seguro que desea eliminar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esta acción no se puede deshacer.`
          + (tieneFilasFacturadas(lote) ? `\n${AVISO_ELIMINAR_FILAS_FACTURADAS}` : ''),
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      // Un hijo no puede tener hijos propios (sin correcciones anidadas).
      const hijos$ = lote.loteOrigenId ? of([]) : this.loteService.listarCorrecciones(lote.loteId);

      hijos$.subscribe(hijos => {
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLoteVidaSalud.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  // Abre el checklist de hijos; cancelar aborta toda la eliminacion, no solo omite hijos.
  private abrirDialogoHijos(lote: LoteVidaSaludResponse, hijos: LoteVidaSaludResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogVidaSaludComponent, {
      width: '480px',
      disableClose: true,
      data: { lote, hijos } satisfies EliminarLoteDialogData,
    });

    dialogRef.afterClosed().subscribe((hijosAEliminar?: number[]) => {
      if (hijosAEliminar) {
        this.confirmarEliminacion(lote.loteId, hijosAEliminar);
      }
    });
  }

  private confirmarEliminacion(loteId: number, hijosAEliminar: number[]): void {
    this.loteService.eliminarLote(loteId, hijosAEliminar).subscribe(() => {
      this.toastr.success('Lote eliminado correctamente', 'Exitoso');

      if (this.lotes().length === 1 && this.pageIndex() > 0) {
        this.pageIndex.update(v => v - 1);
      }

      this.cargarLotes();
    });
  }

  getFechaCompleta(fecha: string): string {
    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm") ?? '';
  }

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly tooltipEstadoLote = tooltipEstadoLote;
  readonly tieneErrorLote = tieneErrorLote;
  readonly usuarioTexto = usuarioTexto;
  readonly usuarioDescripcion = usuarioDescripcion;
}
