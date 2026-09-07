import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { EmisionMasivaLoteService } from 'src/app/services/emision-masiva/emisionMasivaLote.service';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { estadoLoteClase, estadoLoteLabel, tooltipEstadoLote, tieneErrorEmision, usuarioTexto } from '../shared/estados-emision-masiva.util';
import {
  EliminarLoteDialogEmisionComponent,
  EliminarLoteDialogData,
} from '../shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildListarLotesTourSteps } from '../emision-masiva-tour.steps';

const RUTA_CARGAR_LOTE = '/inicio/emision-masiva/cargar-lote';

@Component({
  selector: 'app-listar-lotes-emision',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './listar-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarLotesEmisionComponent implements OnInit {

  private readonly loteService = inject(EmisionMasivaLoteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuService = inject(MenuService);
  private readonly tourService = inject(TourService);

  private static readonly INTERVALO_POLLING_MS = 5000;
  // Coincide con EstadoLoteEmision.INTERMEDIOS del backend.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteEmision[] =
    [EstadoLoteEmision.VALIDANDO, EstadoLoteEmision.PROCESANDO_DOCUMENTOS, EstadoLoteEmision.EMITIENDO];
  // Mismos estados que exige el backend (ESTADOS_EMITIBLES) -- incluye EMITIDO_CON_ERRORES/ERROR_EMISION
  // porque el mismo endpoint /emision sirve para reintentar filas que quedaron con error.
  private static readonly ESTADOS_EMITIBLES: EstadoLoteEmision[] = [
    EstadoLoteEmision.VALIDADO_OK, EstadoLoteEmision.VALIDADO_CON_ERRORES,
    EstadoLoteEmision.EMITIDO_CON_ERRORES, EstadoLoteEmision.ERROR_EMISION,
  ];

  readonly lotes = signal<LoteEmisionResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteEmision | null>(null);
  readonly mostrarEliminados = signal(false);

  readonly estadosDisponibles = Object.values(EstadoLoteEmision);

  readonly displayedColumns: string[] =
    ['#', 'archivo', 'fecha', 'usuario', 'correo', 'estado', 'totalFilas', 'accion'];

  ngOnInit(): void {
    this.leerFiltrosDesdeUrl();
    this.cargarLotes();

    interval(ListarLotesEmisionComponent.INTERVALO_POLLING_MS)
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
    if (estado && (Object.values(EstadoLoteEmision) as string[]).includes(estado)) {
      this.filtroEstado.set(estado as EstadoLoteEmision);
    }

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (params.get('eliminados') === 'true' || this.filtroEstado() === EstadoLoteEmision.ELIMINADO) {
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
    return this.lotes().some(lote => ListarLotesEmisionComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote));
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

  onFiltroEstadoChange(estado: EstadoLoteEmision | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (estado === EstadoLoteEmision.ELIMINADO) {
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

  puedeCargarLote(): boolean {
    return this.menuService.tieneAcceso(RUTA_CARGAR_LOTE);
  }

  iniciarTour(): void {
    this.tourService.start(buildListarLotesTourSteps(this.lotes().length > 0, this.puedeCargarLote()));
  }

  verDetalle(lote: LoteEmisionResponse): void {
    this.router.navigate(['/inicio/emision-masiva/listar-lotes/detalle-lote', lote.loteId]);
  }

  irADetalleLote(loteId: number): void {
    this.router.navigate(['/inicio/emision-masiva/listar-lotes/detalle-lote', loteId]);
  }

  puedeValidar(lote: LoteEmisionResponse): boolean {
    return (lote.estadoLote === EstadoLoteEmision.CARGADO || lote.estadoLote === EstadoLoteEmision.ERROR_VALIDACION)
      && lote.totalFilas > 0;
  }

  // Un lote EMITIDO queda historico: la emision es irreversible, no se puede borrar bajo ninguna
  // condicion (mismo guardrail que el backend aplica siempre, incluso desde Administracion).
  puedeEliminar(lote: LoteEmisionResponse): boolean {
    return lote.estadoLote !== EstadoLoteEmision.ELIMINADO && lote.estadoLote !== EstadoLoteEmision.EMITIDO;
  }

  puedeEmitir(lote: LoteEmisionResponse): boolean {
    return ListarLotesEmisionComponent.ESTADOS_EMITIBLES.includes(lote.estadoLote);
  }

  esReintentoEmision(lote: LoteEmisionResponse): boolean {
    return lote.estadoLote === EstadoLoteEmision.EMITIDO_CON_ERRORES || lote.estadoLote === EstadoLoteEmision.ERROR_EMISION;
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  enProceso(lote: LoteEmisionResponse): boolean {
    return ListarLotesEmisionComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote);
  }

  validar(lote: LoteEmisionResponse): void {
    this.loteService.validarLote(lote.loteId).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLotes();
    });
  }

  emitir(lote: LoteEmisionResponse): void {
    const esReintento = this.esReintentoEmision(lote);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      disableClose: true,
      data: {
        title: esReintento ? 'Reintentar emisión' : 'Emitir lote',
        message: esReintento
          ? `¿Reintentar la emisión del lote #${lote.loteId}? Las filas ya emitidas no se repiten, solo se retoman las pendientes o con error.`
          : `¿Está seguro que desea emitir el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esto marca las pólizas como emitidas de forma definitiva`
            + `${lote.enviaCorreo ? ' y envía los correos de confirmación reales' : ''}.`,
        confirmText: esReintento ? 'Reintentar' : 'Emitir',
        cancelText: 'Cancelar',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.emitirLote(lote.loteId).subscribe(() => {
        this.toastr.info('Emisión de lote iniciada', 'En proceso');
        this.cargarLotes();
      });
    });
  }

  eliminar(lote: LoteEmisionResponse): void {
    if (this.enProceso(lote)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar lote',
        message: `¿Está seguro que desea eliminar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esta acción no se puede deshacer.`,
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
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLoteEmision.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  // Abre el checklist de hijos; cancelar aborta toda la eliminacion, no solo omite hijos.
  private abrirDialogoHijos(lote: LoteEmisionResponse, hijos: LoteEmisionResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogEmisionComponent, {
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
  readonly tieneErrorEmision = tieneErrorEmision;
  readonly usuarioTexto = usuarioTexto;
}
