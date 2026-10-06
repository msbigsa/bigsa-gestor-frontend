import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, interval } from 'rxjs';
import { catchError, exhaustMap, filter } from 'rxjs/operators';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { VidaSaludLoteService } from 'src/app/services/vida-y-salud/vidaSaludLote.service';
import { VidaSaludCompaniaService } from 'src/app/services/vida-y-salud/vidaSaludCompania.service';
import { VidaSaludDocumentosService } from 'src/app/services/vida-y-salud/vidaSaludDocumentos.service';
import { LoteVidaSaludResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludResponse';
import { CompaniaDisponible } from 'src/app/models/vida-y-salud/CompaniaDisponible';
import { LoteVidaSaludConfirmacion } from 'src/app/models/vida-y-salud/LoteVidaSaludConfirmacion';
import { LoteVidaSaludDetalleResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludDetalleResponse';
import { EstadoLoteVidaSalud } from 'src/app/models/vida-y-salud/EstadoLoteVidaSalud';
import { EstadoDetalleVidaSalud } from 'src/app/models/vida-y-salud/EstadoDetalleVidaSalud';
import { EstadoCargaDocumentos } from 'src/app/models/vida-y-salud/EstadoCargaDocumentos';
import { CargaDocumentosResponse } from 'src/app/models/vida-y-salud/CargaDocumentosResponse';
import { ArchivoStaging } from 'src/app/models/vida-y-salud/ArchivoStaging';
import {
  estadoDetalleClase,
  estadoDetalleLabel,
  estadoLoteClase,
  estadoLoteLabel,
  usuarioTexto,
  usuarioDescripcion,
  tooltipEstadoLote,
  tieneErrorLote,
  tieneFilasFacturadas,
  AVISO_ELIMINAR_FILAS_FACTURADAS,
  motivosError,
  tooltipRegistroError,
  agrupacionCorreoLabel,
  estadoCargaDocLabel,
  estadoCargaDocClase,
} from '../shared/estados-vida-salud.util';
import {
  CargarCorreccionDialogVidaSaludComponent,
  CargarCorreccionDialogData,
} from '../shared/cargar-correccion-dialog/cargar-correccion-dialog.component';
import {
  EliminarLoteDialogVidaSaludComponent,
  EliminarLoteDialogData,
} from '../shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import {
  ErroresRegistroDialogVidaSaludComponent,
  ErroresRegistroDialogData,
} from '../shared/errores-registro-dialog/errores-registro-dialog.component';
import {
  SubirDocumentosDialogVidaSaludComponent,
  SubirDocumentosDialogData,
} from '../shared/subir-documentos-dialog/subir-documentos-dialog.component';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildDetalleLoteTourSteps } from '../vida-y-salud-tour.steps';
import {
  VistaPreviaPlantillaDialogComponent,
  VistaPreviaPlantillaDialogData,
} from '../shared/vista-previa-plantilla-dialog/vista-previa-plantilla-dialog.component';

@Component({
  selector: 'app-detalle-lote-vida-salud',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './detalle-lote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleLoteVidaSaludComponent implements OnInit {

  private readonly loteService = inject(VidaSaludLoteService);
  private readonly companiaService = inject(VidaSaludCompaniaService);
  private readonly documentosService = inject(VidaSaludDocumentosService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tourService = inject(TourService);

  private static readonly INTERVALO_POLLING_MS = 5000;
  // Coincide con EstadoLoteVidaSalud.INTERMEDIOS del backend.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteVidaSalud[] =
    [EstadoLoteVidaSalud.VALIDANDO, EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS, EstadoLoteVidaSalud.FACTURANDO];
  // Mismos estados que exige el backend (validarLotePuedeAsociarDocumentos) para subir/procesar documentos.
  private static readonly ESTADOS_PERMITEN_DOCUMENTOS: EstadoLoteVidaSalud[] =
    [EstadoLoteVidaSalud.VALIDADO_OK, EstadoLoteVidaSalud.VALIDADO_CON_ERRORES];
  // Mismos estados que exige el backend (ESTADOS_FACTURABLES) -- incluye FACTURADO_CON_ERRORES/
  // ERROR_FACTURACION porque el mismo endpoint /facturar sirve para reintentar filas con error.
  private static readonly ESTADOS_FACTURABLES: EstadoLoteVidaSalud[] = [
    EstadoLoteVidaSalud.VALIDADO_OK, EstadoLoteVidaSalud.VALIDADO_CON_ERRORES,
    EstadoLoteVidaSalud.FACTURADO_CON_ERRORES, EstadoLoteVidaSalud.ERROR_FACTURACION,
  ];

  // Reactivo via withComponentInputBinding -- se actualiza aunque Angular reutilice la misma
  // instancia del componente al navegar de un detalle-lote a otro.
  readonly id = input.required<string>();
  readonly loteId = computed(() => Number(this.id()));

  readonly lote = signal<LoteVidaSaludResponse | null>(null);
  readonly correcciones = signal<LoteVidaSaludResponse[]>([]);
  // Excluye correcciones ya eliminadas.
  readonly correccionesEliminables = computed(() =>
    this.correcciones().filter(c => c.estadoLote !== EstadoLoteVidaSalud.ELIMINADO)
  );

  readonly companias = toSignal(this.companiaService.listarDisponibles(), { initialValue: [] as CompaniaDisponible[] });
  readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.ciasCodigo, c.ciasNombre]))
  );

  readonly detalles = signal<LoteVidaSaludDetalleResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstadoDetalle = signal<EstadoDetalleVidaSalud | null>(null);

  readonly estadosDetalleDisponibles = Object.values(EstadoDetalleVidaSalud);

  readonly expandedDetalle = signal<LoteVidaSaludDetalleResponse | null>(null);

  // Estado de los paneles del accordion -- "Detalle" abierto por defecto (lo que mas se consulta),
  // "Documentos" cerrado (seccion densa, no siempre relevante). El header (estado/acciones) queda
  // siempre visible fuera del accordion, no es parte de esto.
  readonly documentosExpandido = signal(false);
  readonly detalleExpandido = signal(true);

  // "archivo" (PDF asociado) solo si el lote incluye PDF; "correoEnvio" (resultado del envio, fase 4)
  // solo si el lote envia correo -- ambas se agregan dinamicamente.
  readonly displayedColumns = computed(() => {
    const columnas = ['expand', 'fila', 'factura', 'poliza', 'fecha', 'total'];
    if (this.lote()?.incluyePdf) {
      columnas.push('archivo');
    }
    columnas.push('correo');
    if (this.lote()?.enviaCorreo) {
      columnas.push('correoEnvio');
    }
    columnas.push('estado', 'accion');
    return columnas;
  });

  // Documentos (fase 3) -- lo que se ve aca son "documentos sin asignar": lo que si matcheo se borra
  // de la carpeta y pasa a verse por fila (nombreArchivoPdfResuelto), no en esta seccion.
  readonly cargasDocumentos = signal<CargaDocumentosResponse[]>([]);
  readonly expandedCarga = signal<CargaDocumentosResponse | null>(null);
  readonly archivosEnCarpeta = signal<ArchivoStaging[] | null>(null);
  // Carga de documentos actualmente en PROCESANDO, si hay una -- dispara el poller de mas abajo.
  readonly cargaDocEnCursoId = signal<number | null>(null);

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly detalleEstadoLabel = estadoDetalleLabel;
  readonly detalleEstadoClase = estadoDetalleClase;
  readonly tooltipEstadoLote = tooltipEstadoLote;
  readonly tieneErrorLote = tieneErrorLote;
  readonly usuarioTexto = usuarioTexto;
  readonly usuarioDescripcion = usuarioDescripcion;
  readonly motivosError = motivosError;
  readonly tooltipRegistroError = tooltipRegistroError;
  readonly agrupacionLabel = agrupacionCorreoLabel;
  readonly cargaDocLabel = estadoCargaDocLabel;
  readonly cargaDocClase = estadoCargaDocClase;

  constructor() {
    effect(() => {
      this.id();

      untracked(() => {
        this.pageIndex.set(0);
        this.filtroEstadoDetalle.set(null);
        this.cargaDocEnCursoId.set(null);
        this.cargarLote();
        this.cargarDetalles();
        this.cargarCargasDocumentos();
        this.cargarArchivosCarpeta();
        this.cargarCorrecciones();
      });
    });
  }

  ngOnInit(): void {
    interval(DetalleLoteVidaSaludComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.loteEnProceso()),
        exhaustMap(() => this.loteService.obtenerLote(this.loteId(), true).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(data => this.lote.set(data));

    interval(DetalleLoteVidaSaludComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.loteEnProceso()),
        exhaustMap(() => this.loteService
          .listarDetalles(this.loteId(), this.pageIndex(), this.pageSize(), this.filtroEstadoDetalle() ?? undefined, true)
          .pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(data => {
        this.detalles.set(data.content);
        this.totalElements.set(data.totalElements);
      });

    // Independiente del polling del lote: sigue el intento de "procesar documentos" en curso, si hay uno.
    interval(DetalleLoteVidaSaludComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.cargaDocEnCursoId() !== null),
        exhaustMap(() => this.documentosService
          .obtenerCarga(this.loteId(), this.cargaDocEnCursoId()!, true)
          .pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(carga => this.actualizarCargaDocumento(carga));
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  loteEnProceso(): boolean {
    const estado = this.lote()?.estadoLote;
    return !!estado && DetalleLoteVidaSaludComponent.ESTADOS_EN_PROCESO.includes(estado);
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

  onFiltroEstadoDetalleChange(estado: EstadoDetalleVidaSalud | null): void {
    this.filtroEstadoDetalle.set(estado);
    this.pageIndex.set(0);

    this.cargarDetalles();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargarDetalles();
  }

  toggleExpandido(detalle: LoteVidaSaludDetalleResponse): void {
    this.expandedDetalle.set(this.expandedDetalle() === detalle ? null : detalle);
  }

  // SIN_DOCUMENTO recien lo marca el backend al facturar -- antes de eso se infiere de que la fila
  // esta OK (unica candidata a matching) y ya hubo un intento de "Procesar" sin dejarle archivo.
  documentoNoEncontrado(detalle: LoteVidaSaludDetalleResponse): boolean {
    if (!this.lote()?.incluyePdf || detalle.nombreArchivoPdfResuelto) {
      return false;
    }
    if (detalle.estado === EstadoDetalleVidaSalud.SIN_DOCUMENTO) {
      return true;
    }
    return detalle.estado === EstadoDetalleVidaSalud.OK && this.cargasDocumentos().length > 0;
  }

  verErroresRegistro(detalle: LoteVidaSaludDetalleResponse): void {
    this.dialog.open(ErroresRegistroDialogVidaSaludComponent, {
      width: '440px',
      data: {
        nroFila: detalle.nroFila,
        factura: detalle.nroFacturaRaw ?? '-',
        motivos: this.motivosError(detalle.registroError),
      } satisfies ErroresRegistroDialogData,
    });
  }

  volver(): void {
    this.router.navigate(['/inicio/vida-y-salud/listar-lotes']);
  }

  iniciarTour(): void {
    this.tourService.start(buildDetalleLoteTourSteps(
      this.puedeValidar() || this.puedeFacturar() || this.puedeCorregir() || this.puedeEliminar(),
      this.lote()?.incluyePdf ?? false,
      !this.loteEliminado(),
      this.detalles().length > 0,
    ));
  }

  puedeValidar(): boolean {
    const lote = this.lote();
    return (lote?.estadoLote === EstadoLoteVidaSalud.CARGADO || lote?.estadoLote === EstadoLoteVidaSalud.ERROR_VALIDACION)
      && (lote?.totalFilas ?? 0) > 0;
  }

  loteEliminado(): boolean {
    return this.lote()?.estadoLote === EstadoLoteVidaSalud.ELIMINADO;
  }

  puedeEliminar(): boolean {
    return !this.loteEliminado();
  }

  // No se admiten correcciones anidadas: solo lotes "raiz" (sin padre) pueden corregirse.
  // Tampoco sobre un lote eliminado (ambos ya enforced en backend, esto es solo UI).
  puedeCorregir(): boolean {
    return !this.loteEliminado() && !this.lote()?.loteOrigenId;
  }

  puedeDescargar(): boolean {
    return !this.loteEliminado();
  }

  puedeVerPlantilla(): boolean {
    const lote = this.lote();
    return !!lote?.enviaCorreo && lote.codFormato != null;
  }

  verPlantilla(): void {
    const codFormato = this.lote()?.codFormato;
    if (!codFormato) {
      return;
    }

    this.dialog.open(VistaPreviaPlantillaDialogComponent, {
      width: '640px',
      maxHeight: '90vh',
      data: { formCodigo: codFormato } satisfies VistaPreviaPlantillaDialogData,
    });
  }

  validar(): void {
    this.loteService.validarLote(this.loteId()).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLote();
    });
  }

  puedeFacturar(): boolean {
    const lote = this.lote();
    return !!lote && DetalleLoteVidaSaludComponent.ESTADOS_FACTURABLES.includes(lote.estadoLote);
  }

  // El mismo boton/endpoint sirve para reintentar -- solo cambia el texto para dejar claro que no es
  // "la primera vez".
  esReintentoFacturacion(): boolean {
    const estado = this.lote()?.estadoLote;
    return estado === EstadoLoteVidaSalud.FACTURADO_CON_ERRORES || estado === EstadoLoteVidaSalud.ERROR_FACTURACION;
  }

  facturar(): void {
    const lote = this.lote();
    if (!lote) {
      return;
    }

    // Boton habilitado a proposito (senaliza que falta algo), pero el aviso es bloqueante, sin bypass.
    if (lote.incluyePdf && this.cargasDocumentos().length === 0) {
      this.avisarSinDocumentosProcesados(lote);
      return;
    }

    this.confirmarFacturacion(lote);
  }

  private avisarSinDocumentosProcesados(lote: LoteVidaSaludResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      disableClose: true,
      data: {
        title: 'Documentos sin procesar',
        message: `El lote #${lote.loteId} incluye facturas y nóminas, pero todavía no se procesaron documentos. `
          + 'Por favor suba los archivos y procéselos en el panel "Documentos" para poder continuar.',
        confirmText: 'Entendido',
        type: 'warning',
      },
    });
  }

  private confirmarFacturacion(lote: LoteVidaSaludResponse): void {
    const esReintento = this.esReintentoFacturacion();

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

      const hijos = this.correccionesEliminables();
      if (hijos.length > 0) {
        this.abrirDialogoHijos(lote, hijos);
      } else {
        this.confirmarEliminacion([]);
      }
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
        this.confirmarEliminacion(hijosAEliminar);
      }
    });
  }

  private confirmarEliminacion(hijosAEliminar: number[]): void {
    this.loteService.eliminarLote(this.loteId(), hijosAEliminar).subscribe(() => {
      this.toastr.success('Lote eliminado correctamente', 'Exitoso');
      this.volver();
    });
  }

  eliminarDetalle(detalle: LoteVidaSaludDetalleResponse): void {
    if (this.loteEnProceso()) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar registro',
        message: `¿Está seguro que desea eliminar la fila #${detalle.nroFila} (factura "${detalle.nroFacturaRaw ?? '-'}") de este lote?`,
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
    this.router.navigate(['/inicio/vida-y-salud/listar-lotes/detalle-lote', loteId]);
  }

  descargarLog(): void {
    const nombre = `VidaSalud_${this.loteId()}_${this.timestampArchivo()}.log`;
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

    const dialogRef = this.dialog.open(CargarCorreccionDialogVidaSaludComponent, {
      width: '500px',
      disableClose: true,
      data: {
        loteOrigenId: lote.loteId,
        nombreArchivoOrigen: lote.nombreArchivoOrigen,
      } satisfies CargarCorreccionDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmacion?: LoteVidaSaludConfirmacion) => {
      if (!confirmacion) {
        return;
      }

      this.mostrarExitoCorreccion(confirmacion);
    });
  }

  private mostrarExitoCorreccion(confirmacion: LoteVidaSaludConfirmacion): void {
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

  // Mismo criterio que el backend (validarLotePuedeAsociarDocumentos): solo lotes que incluyen PDF y
  // ya fueron validados. Antes de validar no hay filas OK a las que asignar nada; despues de facturar
  // la carpeta ya se borro.
  puedeGestionarDocumentos(): boolean {
    const lote = this.lote();
    return !!lote && lote.incluyePdf
      && DetalleLoteVidaSaludComponent.ESTADOS_PERMITEN_DOCUMENTOS.includes(lote.estadoLote);
  }

  // Se ve en el header del panel "Documentos" aunque esté colapsado -- para que quede claro que ese
  // es el siguiente paso apenas se valida, sin tener que abrirlo primero para descubrirlo.
  documentosResumen(): string {
    const lote = this.lote();
    if (!lote) {
      return '';
    }

    if (lote.estadoLote === EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS) {
      return 'Procesando...';
    }

    if (!this.puedeGestionarDocumentos()) {
      return lote.estadoLote === EstadoLoteVidaSalud.CARGADO || lote.estadoLote === EstadoLoteVidaSalud.ERROR_VALIDACION
          || lote.estadoLote === EstadoLoteVidaSalud.VALIDANDO
        ? 'Disponible después de validar'
        : 'Ya no disponible';
    }

    const pendientes = this.archivosEnCarpeta()?.length ?? 0;

    if (pendientes > 0) {
      return `${pendientes} archivo(s) sin procesar`;
    }

    return this.cargasDocumentos().length === 0 ? 'Pendiente: sube los documentos' : 'Sin archivos pendientes';
  }

  // Resalta el resumen cuando hay algo que requiere accion del usuario.
  documentosRequiereAtencion(): boolean {
    if (!this.puedeGestionarDocumentos()) {
      return false;
    }

    const pendientes = this.archivosEnCarpeta()?.length ?? 0;
    return pendientes > 0 || this.cargasDocumentos().length === 0;
  }

  cargarCargasDocumentos(): void {
    this.documentosService.listarCargas(this.loteId()).subscribe(data => this.cargasDocumentos.set(data));
  }

  cargarArchivosCarpeta(silencioso = false): void {
    this.documentosService.listarArchivosCarpeta(this.loteId(), silencioso).subscribe(data => this.archivosEnCarpeta.set(data));
  }

  toggleExpandidoCarga(carga: CargaDocumentosResponse): void {
    this.expandedCarga.set(this.expandedCarga() === carga ? null : carga);
  }

  abrirDialogoSubirDocumentos(): void {
    const dialogRef = this.dialog.open(SubirDocumentosDialogVidaSaludComponent, {
      width: '500px',
      disableClose: true,
      data: { loteId: this.loteId() } satisfies SubirDocumentosDialogData,
    });

    dialogRef.afterClosed().subscribe(respuesta => {
      if (!respuesta) {
        return;
      }

      this.toastr.success(`Se copiaron ${respuesta.archivosExtraidos} archivo(s) a la carpeta del lote.`, 'Exitoso');
      this.cargarArchivosCarpeta();
    });
  }

  procesarDocumentos(): void {
    this.documentosService.procesarDocumentos(this.loteId()).subscribe(confirmacion => {
      this.toastr.info('Procesamiento de documentos iniciado', 'En proceso');
      this.cargaDocEnCursoId.set(confirmacion.cargaDocId);
      this.cargarCargasDocumentos();
      // El backend ya hizo el CAS a PROCESANDO_DOCUMENTOS de forma sincrona antes de responder --
      // se refresca ya, sin esperar al proximo tick del polling.
      this.cargarLote();
    });
  }

  private actualizarCargaDocumento(carga: CargaDocumentosResponse): void {
    this.cargasDocumentos.update(actuales => {
      const existe = actuales.some(c => c.cargaDocId === carga.cargaDocId);
      return existe ? actuales.map(c => c.cargaDocId === carga.cargaDocId ? carga : c) : [carga, ...actuales];
    });

    if (carga.estado === EstadoCargaDocumentos.PROCESANDO) {
      return;
    }

    this.cargaDocEnCursoId.set(null);
    this.cargarArchivosCarpeta();
    this.cargarDetalles();

    if (carga.estado === EstadoCargaDocumentos.COMPLETADO) {
      this.toastr.success(`Procesamiento completado: ${carga.totalDocumentosMatcheados ?? 0} documento(s) asignado(s).`, 'Exitoso');
    } else {
      this.toastr.error(carga.mensajeError ?? 'Falló el procesamiento de documentos', 'Error');
    }
  }

  desasignarDocumento(detalle: LoteVidaSaludDetalleResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Desasignar documento',
        message: `¿Desasignar el documento "${detalle.nombreArchivoPdfResuelto}" de la fila #${detalle.nroFila}? El archivo dejará de estar disponible; deberá volver a subirlo y procesarlo si lo necesita nuevamente.`,
        confirmText: 'Desasignar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.documentosService.desasignarDocumento(this.loteId(), detalle.detalleId).subscribe(() => {
        this.toastr.success('Documento desasignado correctamente', 'Exitoso');
        this.cargarDetalles();
      });
    });
  }
}
