import { Component, DestroyRef, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
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
import { LoteCargaConfirmacion } from 'src/app/models/aviso-cobranza/LoteCargaConfirmacion';
import { LoteDetalleResponse } from 'src/app/models/aviso-cobranza/LoteDetalleResponse';
import { EstadoLote } from 'src/app/models/aviso-cobranza/EstadoLote';
import { EstadoDetalle } from 'src/app/models/aviso-cobranza/EstadoDetalle';
import {
  estadoDetalleClase,
  estadoDetalleLabel,
  estadoLoteClase,
  estadoLoteLabel,
  filasPendientesDeEnviar,
  origenCorreoClase,
  origenCorreoIcono,
  origenCorreoTooltip,
  usuarioTexto,
  tooltipEliminado,
} from '../shared/estados-aviso-cobranza.util';
import {
  CargarCorreccionDialogComponent,
  CargarCorreccionDialogData,
} from '../shared/cargar-correccion-dialog/cargar-correccion-dialog.component';

@Component({
  selector: 'app-detalle-lote',
  imports: [CommonModule, MaterialModule, MatPaginatorModule, TablerIconsModule],
  providers: [DatePipe],
  templateUrl: './detalle-lote.component.html',
})
export class DetalleLoteComponent implements OnInit {

  private readonly loteService = inject(AvisoCobranzaLoteService);
  private readonly companiaService = inject(AvisoCobranzaCompaniaService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly INTERVALO_POLLING_MS = 5000;
  private static readonly ESTADOS_EN_PROCESO: EstadoLote[] = [EstadoLote.VALIDANDO, EstadoLote.ENVIANDO];

  // Reactivo via withComponentInputBinding -- se actualiza aunque Angular reutilice la misma
  // instancia del componente al navegar de un detalle-lote a otro.
  readonly id = input.required<string>();
  readonly loteId = computed(() => Number(this.id()));

  readonly lote = signal<LoteCargaResponse | null>(null);
  readonly correcciones = signal<LoteCargaResponse[]>([]);

  readonly companias = signal<CompaniaDisponible[]>([]);
  readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.ciasCodigo, c.ciasNombre]))
  );

  readonly detalles = signal<LoteDetalleResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstadoDetalle = signal<EstadoDetalle | null>(null);

  readonly estadosDetalleDisponibles = Object.values(EstadoDetalle);

  readonly expandedDetalle = signal<LoteDetalleResponse | null>(null);

  readonly displayedColumns: string[] =
    ['expand', 'fila', 'poliza', 'cuotas', 'vencimiento', 'prima', 'correo', 'estado', 'accion'];

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly detalleEstadoLabel = estadoDetalleLabel;
  readonly detalleEstadoClase = estadoDetalleClase;
  readonly origenCorreoTooltip = origenCorreoTooltip;
  readonly origenCorreoIcono = origenCorreoIcono;
  readonly origenCorreoClase = origenCorreoClase;
  readonly tooltipEliminado = tooltipEliminado;
  readonly usuarioTexto = usuarioTexto;

  constructor() {
    effect(() => {
      this.id();

      untracked(() => {
        this.pageIndex.set(0);
        this.filtroEstadoDetalle.set(null);
        this.cargarLote();
        this.cargarDetalles();
        this.cargarCorrecciones();
      });
    });
  }

  ngOnInit(): void {
    this.companiaService.listarDisponibles().subscribe(data => this.companias.set(data));

    interval(DetalleLoteComponent.INTERVALO_POLLING_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.loteEnProceso()) {
          this.cargarLote(true);
          this.cargarDetalles(true);
        }
      });
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  loteEnProceso(): boolean {
    const estado = this.lote()?.estadoLote;
    return !!estado && DetalleLoteComponent.ESTADOS_EN_PROCESO.includes(estado);
  }

  cargarLote(silencioso = false): void {
    this.loteService.obtenerLote(this.loteId(), silencioso).subscribe(data => this.lote.set(data));
  }

  cargarDetalles(silencioso = false): void {
    this.loteService
      .listarDetalles(this.loteId(), this.pageIndex(), this.pageSize(), this.filtroEstadoDetalle() ?? undefined, silencioso)
      .subscribe(data => {
        this.detalles.set(data.content);
        this.totalElements.set(data.totalElements);
      });
  }

  cargarCorrecciones(): void {
    this.loteService.listarCorrecciones(this.loteId()).subscribe(data => this.correcciones.set(data));
  }

  actualizar(): void {
    this.cargarLote();
    this.cargarDetalles();
  }

  onFiltroEstadoDetalleChange(estado: EstadoDetalle | null): void {
    this.filtroEstadoDetalle.set(estado);
    this.pageIndex.set(0);

    this.cargarDetalles();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargarDetalles();
  }

  toggleExpandido(detalle: LoteDetalleResponse): void {
    this.expandedDetalle.set(this.expandedDetalle() === detalle ? null : detalle);
  }

  // Antes de validar, los datos "resueltos" (incluido el origen del correo) no existen todavía.
  iconoCorreo(detalle: LoteDetalleResponse): string | null {
    if (detalle.estado === EstadoDetalle.PENDIENTE) {
      return null;
    }

    return this.origenCorreoIcono(detalle.origenCorreo);
  }

  volver(): void {
    this.router.navigate(['/inicio/avisos-cobranza/listar-lotes']);
  }

  puedeValidar(): boolean {
    const lote = this.lote();
    return (lote?.estadoLote === EstadoLote.CARGADO || lote?.estadoLote === EstadoLote.ERROR_VALIDACION)
      && (lote?.totalFilas ?? 0) > 0;
  }

  puedeEnviar(): boolean {
    const lote = this.lote();
    return !!lote
      && (lote.estadoLote === EstadoLote.VALIDADO_OK
        || lote.estadoLote === EstadoLote.VALIDADO_CON_ERRORES
        || lote.estadoLote === EstadoLote.ERROR_ENVIO)
      && filasPendientesDeEnviar(lote) > 0;
  }

  puedeEliminar(): boolean {
    return this.lote()?.estadoLote !== EstadoLote.ELIMINADO;
  }

  // No se admiten correcciones anidadas: solo lotes "raiz" (sin padre) pueden corregirse.
  puedeCorregir(): boolean {
    return !this.lote()?.loteOrigenId;
  }

  validar(): void {
    this.loteService.validarLote(this.loteId()).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLote();
    });
  }

  enviar(): void {
    const lote = this.lote();
    if (!lote) {
      return;
    }

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

      this.loteService.enviarLote(this.loteId()).subscribe(() => {
        this.toastr.info('Envío de lote iniciado', 'En proceso');
        this.cargarLote();
      });
    });
  }

  eliminarLote(): void {
    const lote = this.lote();
    if (!lote || this.loteEnProceso()) {
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

      this.loteService.eliminarLote(this.loteId()).subscribe(() => {
        this.toastr.success('Lote eliminado correctamente', 'Exitoso');
        this.volver();
      });
    });
  }

  eliminarDetalle(detalle: LoteDetalleResponse): void {
    if (this.loteEnProceso()) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar registro',
        message: `¿Está seguro que desea eliminar la fila #${detalle.nroFila} (póliza "${detalle.nroPolizaRaw}") de este lote?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.eliminarDetalle(this.loteId(), detalle.detalleId).subscribe(() => {
        this.toastr.success('Registro eliminado correctamente', 'Exitoso');

        if (this.detalles().length === 1 && this.pageIndex() > 0) {
          this.pageIndex.update(v => v - 1);
        }

        this.cargarLote();
        this.cargarDetalles();
      });
    });
  }

  getFechaCompleta(fecha: string | undefined): string {
    if (!fecha) {
      return '';
    }

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

  irADetalleLote(loteId: number): void {
    this.router.navigate(['/inicio/avisos-cobranza/detalle-lote', loteId]);
  }

  descargarLog(): void {
    const nombre = `AvisosCorte_${this.loteId()}_${this.timestampArchivo()}.log`;
    this.loteService.descargarLog(this.loteId()).subscribe(response => this.descargarArchivo(response, nombre));
  }

  descargarResumen(): void {
    const nombre = `Resumen_${this.loteId()}_${this.timestampArchivo()}.csv`;
    this.loteService.descargarResumen(this.loteId()).subscribe(response => this.descargarArchivo(response, nombre));
  }

  // Se arma el nombre aca en vez de leerlo de Content-Disposition porque ese header no esta
  // expuesto en el CORS del backend, asi que el navegador nunca lo deja leer via JS.
  private timestampArchivo(): string {
    return this.datePipe.transform(new Date(), 'yyyyMMdd') ?? '';
  }

  private descargarArchivo(response: HttpResponse<Blob>, nombrePorDefecto: string): void {
    const blob = response.body!;
    const contentDisposition = response.headers.get('Content-Disposition');
    let nombreArchivo = nombrePorDefecto;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) {
        nombreArchivo = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  abrirDialogoCorreccion(): void {
    const lote = this.lote();
    if (!lote || this.loteEnProceso()) {
      return;
    }

    const dialogRef = this.dialog.open(CargarCorreccionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        loteOrigenId: lote.loteId,
        nombreArchivoOrigen: lote.nombreArchivoOrigen,
      } satisfies CargarCorreccionDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmacion?: LoteCargaConfirmacion) => {
      if (!confirmacion) {
        return;
      }

      this.mostrarExitoCorreccion(confirmacion);
    });
  }

  private mostrarExitoCorreccion(confirmacion: LoteCargaConfirmacion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Corrección cargada exitosamente',
        message: `Se cargaron ${confirmacion.totalFilas} filas del archivo "${confirmacion.nombreArchivoOrigen}" (lote #${confirmacion.loteId}).`,
        confirmText: 'Aceptar',
        type: 'success',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      // Se espera la respuesta (el backend marca VALIDANDO de forma sincrona) antes de navegar.
      this.loteService.validarLote(confirmacion.loteId).subscribe(() => {
        this.irADetalleLote(confirmacion.loteId);
      });
    });
  }
}
