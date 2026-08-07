import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { interval } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { AvisoCobranzaLoteService } from 'src/app/services/aviso-cobranza/avisoCobranzaLote.service';
import { AvisoCobranzaCompaniaService } from 'src/app/services/aviso-cobranza/avisoCobranzaCompania.service';
import { LoteCargaResponse } from 'src/app/models/aviso-cobranza/LoteCargaResponse';
import { CompaniaDisponible } from 'src/app/models/aviso-cobranza/CompaniaDisponible';
import { EstadoLote } from 'src/app/models/aviso-cobranza/EstadoLote';
import { estadoLoteClase, estadoLoteLabel, filasPendientesDeEnviar, usuarioTexto, tooltipEliminado } from '../shared/estados-aviso-cobranza.util';

@Component({
  selector: 'app-listar-lotes',
  imports: [CommonModule, MaterialModule, MatPaginatorModule, TablerIconsModule],
  providers: [DatePipe],
  templateUrl: './listar-lotes.component.html',
})
export class ListarLotesComponent implements OnInit {

  private readonly loteService = inject(AvisoCobranzaLoteService);
  private readonly companiaService = inject(AvisoCobranzaCompaniaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly INTERVALO_POLLING_MS = 5000;
  private static readonly ESTADOS_EN_PROCESO: EstadoLote[] = [EstadoLote.VALIDANDO, EstadoLote.ENVIANDO];

  readonly lotes = signal<LoteCargaResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLote | null>(null);
  readonly filtroCompania = signal<number | null>(null);
  readonly mostrarEliminados = signal(false);

  readonly companias = signal<CompaniaDisponible[]>([]);
  readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.ciasCodigo, c.ciasNombre]))
  );

  readonly estadosDisponibles = Object.values(EstadoLote);

  readonly displayedColumns: string[] =
    ['#', 'archivo', 'compania', 'fecha', 'usuario', 'estado', 'totalFilas', 'accion'];

  ngOnInit(): void {
    this.leerFiltrosDesdeUrl();
    this.cargarLotes();
    this.companiaService.listarDisponibles().subscribe(data => this.companias.set(data));

    interval(ListarLotesComponent.INTERVALO_POLLING_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.hayLotesEnProceso()) {
          this.cargarLotes(true);
        }
      });
  }

  // Para que los filtros/pagina se mantengan al volver del detalle en vez de resetearse.
  private leerFiltrosDesdeUrl(): void {
    const params = this.route.snapshot.queryParamMap;

    const estado = params.get('estado');
    if (estado && (Object.values(EstadoLote) as string[]).includes(estado)) {
      this.filtroEstado.set(estado as EstadoLote);
    }

    const ciasCodigo = Number(params.get('ciasCodigo'));
    if (ciasCodigo) {
      this.filtroCompania.set(ciasCodigo);
    }

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (params.get('eliminados') === 'true' || this.filtroEstado() === EstadoLote.ELIMINADO) {
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
        ciasCodigo: this.filtroCompania() ?? null,
        eliminados: this.mostrarEliminados() ? 'true' : null,
        page: this.pageIndex() || null,
        size: this.pageSize() !== 10 ? this.pageSize() : null,
      },
      replaceUrl: true,
    });
  }

  private hayLotesEnProceso(): boolean {
    return this.lotes().some(lote => ListarLotesComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote));
  }

  cargarLotes(silencioso = false): void {
    this.loteService.listarLotes(
      this.pageIndex(),
      this.pageSize(),
      this.filtroEstado() ?? undefined,
      this.filtroCompania() ?? undefined,
      silencioso,
      this.mostrarEliminados(),
    ).subscribe(data => {
      this.lotes.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  onFiltroEstadoChange(estado: EstadoLote | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);

    // Filtrar por "Eliminado" sin esto activo devuelve vacio (el backend hace AND entre ambos).
    if (estado === EstadoLote.ELIMINADO) {
      this.mostrarEliminados.set(true);
    }

    this.cargarLotes();
    this.sincronizarQueryParams();
  }

  onFiltroCompaniaChange(ciasCodigo: number | null): void {
    this.filtroCompania.set(ciasCodigo);
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
    this.router.navigate(['/inicio/avisos-cobranza/cargar-lote']);
  }

  verDetalle(lote: LoteCargaResponse): void {
    this.router.navigate(['/inicio/avisos-cobranza/detalle-lote', lote.loteId]);
  }

  irADetalleLote(loteId: number): void {
    this.router.navigate(['/inicio/avisos-cobranza/detalle-lote', loteId]);
  }

  puedeValidar(lote: LoteCargaResponse): boolean {
    return (lote.estadoLote === EstadoLote.CARGADO || lote.estadoLote === EstadoLote.ERROR_VALIDACION)
      && lote.totalFilas > 0;
  }

  puedeEliminar(lote: LoteCargaResponse): boolean {
    return lote.estadoLote !== EstadoLote.ELIMINADO;
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  enProceso(lote: LoteCargaResponse): boolean {
    return ListarLotesComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote);
  }

  puedeEnviar(lote: LoteCargaResponse): boolean {
    return (lote.estadoLote === EstadoLote.VALIDADO_OK
      || lote.estadoLote === EstadoLote.VALIDADO_CON_ERRORES
      || lote.estadoLote === EstadoLote.ERROR_ENVIO)
      && filasPendientesDeEnviar(lote) > 0;
  }

  validar(lote: LoteCargaResponse): void {
    this.loteService.validarLote(lote.loteId).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLotes();
    });
  }

  enviar(lote: LoteCargaResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Enviar avisos de cobranza',
        message: `¿Está seguro que desea enviar los avisos de cobranza del lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Se enviarán correos reales a los clientes/ejecutivos correspondientes.`,
        confirmText: 'Enviar',
        cancelText: 'Cancelar',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.enviarLote(lote.loteId).subscribe(() => {
        this.toastr.info('Envío de lote iniciado', 'En proceso');
        this.cargarLotes();
      });
    });
  }

  eliminar(lote: LoteCargaResponse): void {
    if (this.enProceso(lote)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar lote',
        message: `¿Está seguro que desea eliminar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esta acción también eliminará sus lotes de corrección asociados (si tiene) y no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.eliminarLote(lote.loteId).subscribe(() => {
        this.toastr.success('Lote eliminado correctamente', 'Exitoso');

        if (this.lotes().length === 1 && this.pageIndex() > 0) {
          this.pageIndex.update(v => v - 1);
        }

        this.cargarLotes();
      });
    });
  }

  getFechaCompleta(fecha: string): string {
    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm") ?? '';
  }

  // "codigo - nombre": mas facil de ubicar para quienes se guian por el codigo.
  nombreCompania(ciasCodigo: number | undefined): string {
    if (ciasCodigo == null) {
      return '-';
    }

    const nombre = this.nombreCompaniaPorCodigo().get(ciasCodigo);
    return nombre ? `${ciasCodigo} - ${nombre}` : `${ciasCodigo}`;
  }

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly tooltipEliminado = tooltipEliminado;
  readonly usuarioTexto = usuarioTexto;
}
