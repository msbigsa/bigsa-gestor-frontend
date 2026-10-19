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
import { CargaMasivaGenericaLoteService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaLote.service';
import { CargaMasivaGenericaTipoCargaService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaTipoCarga.service';
import { CargaMasivaGenericaCatalogoService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaCatalogo.service';
import { ItemCatalogo } from 'src/app/models/carga-masiva-generica/ItemCatalogo';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { EstadoLoteCarga } from 'src/app/models/carga-masiva-generica/EstadoLoteCarga';
import { TipoCarga } from 'src/app/models/carga-masiva-generica/TipoCarga';
import { TipoCargaDisponible } from 'src/app/models/carga-masiva-generica/TipoCargaDisponible';
import {
  AVISO_EJECUCION_NO_DISPONIBLE,
  EJECUCION_DISPONIBLE,
  ESTADOS_EJECUTABLES,
  ESTADOS_EN_PROCESO,
  estadoLoteClase,
  estadoLoteLabel,
  tooltipEstadoLote,
  tieneErrorLote,
  usuarioTexto,
  usuarioDescripcion,
} from '../shared/estados-carga-masiva.util';
import {
  EliminarLoteDialogCargaMasivaComponent,
  EliminarLoteDialogData,
} from '../shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';

const RUTA_CARGAR_LOTE = '/inicio/carga-masiva-generica/cargar-lote';
const RUTA_DETALLE_LOTE = '/inicio/carga-masiva-generica/listar-lotes/detalle-lote';

@Component({
  selector: 'app-listar-lotes-carga-masiva',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './listar-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarLotesCargaMasivaComponent implements OnInit {

  private readonly loteService = inject(CargaMasivaGenericaLoteService);
  private readonly tipoCargaService = inject(CargaMasivaGenericaTipoCargaService);
  private readonly catalogoService = inject(CargaMasivaGenericaCatalogoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuService = inject(MenuService);

  private static readonly INTERVALO_POLLING_MS = 5000;

  readonly lotes = signal<LoteCargaResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteCarga | null>(null);
  readonly filtroTipoCarga = signal<TipoCarga | null>(null);
  readonly mostrarEliminados = signal(false);

  readonly estadosDisponibles = Object.values(EstadoLoteCarga);
  readonly tiposCarga = toSignal(this.tipoCargaService.listarDisponibles(), { initialValue: [] as TipoCargaDisponible[] });
  readonly companias = toSignal(this.catalogoService.listarCompanias(), { initialValue: [] as ItemCatalogo[] });
  private readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.codigo, c.descripcion]))
  );

  readonly displayedColumns: string[] =
    ['#', 'tipo', 'archivo', 'compania', 'fecha', 'usuario', 'estado', 'totalFilas', 'accion'];

  readonly ejecucionDisponible = EJECUCION_DISPONIBLE;
  readonly avisoEjecucion = AVISO_EJECUCION_NO_DISPONIBLE;

  ngOnInit(): void {
    this.leerFiltrosDesdeUrl();
    this.cargarLotes();

    interval(ListarLotesCargaMasivaComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.hayLotesEnProceso()),
        exhaustMap(() => this.listar(true).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(data => {
        this.lotes.set(data.content);
        this.totalElements.set(data.totalElements);
      });
  }

  // Para que los filtros/pagina se mantengan al volver del detalle.
  private leerFiltrosDesdeUrl(): void {
    const params = this.route.snapshot.queryParamMap;

    const estado = params.get('estado');
    if (estado && (Object.values(EstadoLoteCarga) as string[]).includes(estado)) {
      this.filtroEstado.set(estado as EstadoLoteCarga);
    }

    const tipo = params.get('tipo');
    if (tipo && (Object.values(TipoCarga) as string[]).includes(tipo)) {
      this.filtroTipoCarga.set(tipo as TipoCarga);
    }

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (params.get('eliminados') === 'true' || this.filtroEstado() === EstadoLoteCarga.ELIMINADO) {
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
        tipo: this.filtroTipoCarga() ?? null,
        eliminados: this.mostrarEliminados() ? 'true' : null,
        page: this.pageIndex() || null,
        size: this.pageSize() !== 10 ? this.pageSize() : null,
      },
      replaceUrl: true,
    });
  }

  private hayLotesEnProceso(): boolean {
    return this.lotes().some(lote => this.enProceso(lote));
  }

  private listar(silencioso: boolean) {
    return this.loteService.listarLotes(
      this.pageIndex(),
      this.pageSize(),
      this.filtroEstado() ?? undefined,
      this.filtroTipoCarga() ?? undefined,
      silencioso,
      this.mostrarEliminados(),
    );
  }

  cargarLotes(silencioso = false): void {
    this.listar(silencioso).subscribe(data => {
      this.lotes.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  onFiltroEstadoChange(estado: EstadoLoteCarga | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (estado === EstadoLoteCarga.ELIMINADO) {
      this.mostrarEliminados.set(true);
    }

    this.cargarLotes();
    this.sincronizarQueryParams();
  }

  onFiltroTipoCargaChange(tipo: TipoCarga | null): void {
    this.filtroTipoCarga.set(tipo);
    this.pageIndex.set(0);

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

  irADetalleLote(loteId: number): void {
    this.router.navigate([RUTA_DETALLE_LOTE, loteId]);
  }

  puedeCargarLote(): boolean {
    return this.menuService.tieneAcceso(RUTA_CARGAR_LOTE);
  }

  compania(lote: LoteCargaResponse): string {
    if (lote.multiplesCompanias) {
      return 'Múltiples';
    }

    if (lote.ciasCodigo == null) {
      return '-';
    }

    // "codigo - nombre": mas facil de ubicar para quienes se guian por el codigo.
    const nombre = this.nombreCompaniaPorCodigo().get(lote.ciasCodigo);
    return nombre ? `${lote.ciasCodigo} - ${nombre}` : `${lote.ciasCodigo}`;
  }

  puedeValidar(lote: LoteCargaResponse): boolean {
    return (lote.estadoLote === EstadoLoteCarga.CARGADO || lote.estadoLote === EstadoLoteCarga.ERROR_VALIDACION)
      && lote.totalFilas > 0;
  }

  puedeEjecutar(lote: LoteCargaResponse): boolean {
    return ESTADOS_EJECUTABLES.includes(lote.estadoLote);
  }

  puedeEliminar(lote: LoteCargaResponse): boolean {
    return lote.estadoLote !== EstadoLoteCarga.ELIMINADO;
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  enProceso(lote: LoteCargaResponse): boolean {
    return ESTADOS_EN_PROCESO.includes(lote.estadoLote);
  }

  validar(lote: LoteCargaResponse): void {
    this.loteService.validarLote(lote.loteId).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLotes();
    });
  }

  eliminar(lote: LoteCargaResponse): void {
    if (this.enProceso(lote)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
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
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLoteCarga.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  // Abre el checklist de hijos; cancelar aborta toda la eliminacion, no solo omite hijos.
  private abrirDialogoHijos(lote: LoteCargaResponse, hijos: LoteCargaResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogCargaMasivaComponent, {
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
