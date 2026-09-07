import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, interval } from 'rxjs';
import { catchError, exhaustMap, filter } from 'rxjs/operators';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { EmisionMasivaLoteService } from 'src/app/services/emision-masiva/emisionMasivaLote.service';
import { EmisionMasivaDocumentosService } from 'src/app/services/emision-masiva/emisionMasivaDocumentos.service';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { LoteEmisionDetalleResponse } from 'src/app/models/emision-masiva/LoteEmisionDetalleResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { EstadoDetalleEmision } from 'src/app/models/emision-masiva/EstadoDetalleEmision';
import { EstadoCargaDocumentos } from 'src/app/models/emision-masiva/EstadoCargaDocumentos';
import { CargaDocumentosResponse } from 'src/app/models/emision-masiva/CargaDocumentosResponse';
import { ArchivoStaging } from 'src/app/models/emision-masiva/ArchivoStaging';
import {
  estadoLoteLabel,
  estadoLoteClase,
  tooltipEstadoLote,
  tieneErrorEmision,
  usuarioTexto,
  estadoDetalleLabel,
  estadoDetalleClase,
  tooltipRegistroError,
  numeroConDigito,
  opcionBusquedaLabel,
  codDestinatarioLabel,
  codLlaveBusquedaLabel,
  estadoCargaDocLabel,
  estadoCargaDocClase,
} from '../shared/estados-emision-masiva.util';
import {
  SubirDocumentosDialogComponent,
  SubirDocumentosDialogData,
} from '../shared/subir-documentos-dialog/subir-documentos-dialog.component';
import {
  CargarCorreccionDialogEmisionComponent,
  CargarCorreccionDialogData,
} from '../shared/cargar-correccion-dialog/cargar-correccion-dialog.component';
import {
  EliminarLoteDialogEmisionComponent,
  EliminarLoteDialogData,
} from '../shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { LoteEmisionConfirmacion } from 'src/app/models/emision-masiva/LoteEmisionConfirmacion';

@Component({
  selector: 'app-detalle-lote-emision',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './detalle-lote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleLoteEmisionComponent implements OnInit {

  private readonly loteService = inject(EmisionMasivaLoteService);
  private readonly documentosService = inject(EmisionMasivaDocumentosService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly INTERVALO_POLLING_MS = 5000;
  // Coincide con EstadoLoteEmision.INTERMEDIOS del backend.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteEmision[] =
    [EstadoLoteEmision.VALIDANDO, EstadoLoteEmision.PROCESANDO_DOCUMENTOS, EstadoLoteEmision.EMITIENDO];
  // Mismos estados que exige el backend (validarLotePuedeAsociarDocumentos) para subir/procesar documentos.
  private static readonly ESTADOS_PERMITEN_DOCUMENTOS: EstadoLoteEmision[] =
    [EstadoLoteEmision.VALIDADO_OK, EstadoLoteEmision.VALIDADO_CON_ERRORES];
  // Mismos estados que exige el backend (ESTADOS_EMITIBLES) -- incluye EMITIDO_CON_ERRORES/ERROR_EMISION
  // porque el mismo endpoint /emision sirve para reintentar filas que quedaron con error.
  private static readonly ESTADOS_EMITIBLES: EstadoLoteEmision[] = [
    EstadoLoteEmision.VALIDADO_OK, EstadoLoteEmision.VALIDADO_CON_ERRORES,
    EstadoLoteEmision.EMITIDO_CON_ERRORES, EstadoLoteEmision.ERROR_EMISION,
  ];

  // Reactivo via withComponentInputBinding -- se actualiza aunque Angular reutilice la misma
  // instancia del componente al navegar de un detalle-lote a otro.
  readonly id = input.required<string>();
  readonly loteId = computed(() => Number(this.id()));

  readonly lote = signal<LoteEmisionResponse | null>(null);
  readonly correcciones = signal<LoteEmisionResponse[]>([]);
  // Excluye correcciones ya eliminadas.
  readonly correccionesEliminables = computed(() =>
    this.correcciones().filter(c => c.estadoLote !== EstadoLoteEmision.ELIMINADO)
  );

  readonly detalles = signal<LoteEmisionDetalleResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstadoDetalle = signal<EstadoDetalleEmision | null>(null);
  readonly estadosDetalleDisponibles = Object.values(EstadoDetalleEmision);

  readonly expandedDetalle = signal<LoteEmisionDetalleResponse | null>(null);

  // Estado de los paneles del accordion -- "Detalle" abierto por defecto (lo que mas se consulta),
  // "Documentos" cerrado (seccion densa, no siempre relevante). El header (estado/acciones) queda
  // siempre visible fuera del accordion, no es parte de esto.
  readonly documentosExpandido = signal(false);
  readonly detalleExpandido = signal(true);

  // La columna "correo" solo tiene sentido si el lote envia correo -- se agrega dinamicamente.
  readonly displayedColumns = computed(() => {
    const columnas = ['expand', 'fila', 'documento', 'poliza', 'endoso', 'estado'];
    if (this.lote()?.enviaCorreo) {
      columnas.push('correo');
    }
    columnas.push('accion');
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
  readonly tooltipEstadoLote = tooltipEstadoLote;
  readonly tieneErrorEmision = tieneErrorEmision;
  readonly usuarioTexto = usuarioTexto;
  readonly detalleEstadoLabel = estadoDetalleLabel;
  readonly detalleEstadoClase = estadoDetalleClase;
  readonly tooltipRegistroError = tooltipRegistroError;
  readonly numeroConDigito = numeroConDigito;
  readonly opcionLabel = opcionBusquedaLabel;
  readonly destinatarioLabel = codDestinatarioLabel;
  readonly llaveLabel = codLlaveBusquedaLabel;
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
    interval(DetalleLoteEmisionComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.loteEnProceso()),
        exhaustMap(() => this.loteService.obtenerLote(this.loteId(), true).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(data => this.lote.set(data));

    interval(DetalleLoteEmisionComponent.INTERVALO_POLLING_MS)
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
    interval(DetalleLoteEmisionComponent.INTERVALO_POLLING_MS)
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
    return !!estado && DetalleLoteEmisionComponent.ESTADOS_EN_PROCESO.includes(estado);
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

  irADetalleLote(loteId: number): void {
    this.router.navigate(['/inicio/emision-masiva/listar-lotes/detalle-lote', loteId]);
  }

  actualizar(): void {
    this.cargarLote();
    this.cargarDetalles();
  }

  onFiltroEstadoDetalleChange(estado: EstadoDetalleEmision | null): void {
    this.filtroEstadoDetalle.set(estado);
    this.pageIndex.set(0);

    this.cargarDetalles();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargarDetalles();
  }

  toggleExpandido(detalle: LoteEmisionDetalleResponse): void {
    this.expandedDetalle.set(this.expandedDetalle() === detalle ? null : detalle);
  }

  volver(): void {
    this.router.navigate(['/inicio/emision-masiva/listar-lotes']);
  }

  puedeValidar(): boolean {
    const lote = this.lote();
    return (lote?.estadoLote === EstadoLoteEmision.CARGADO || lote?.estadoLote === EstadoLoteEmision.ERROR_VALIDACION)
      && (lote?.totalFilas ?? 0) > 0;
  }

  loteEliminado(): boolean {
    return this.lote()?.estadoLote === EstadoLoteEmision.ELIMINADO;
  }

  // Un lote EMITIDO queda historico: la emision es irreversible, no se puede borrar bajo ninguna
  // condicion (mismo guardrail que el backend aplica siempre, incluso desde Administracion).
  puedeEliminar(): boolean {
    return !this.loteEliminado() && this.lote()?.estadoLote !== EstadoLoteEmision.EMITIDO;
  }

  // No se admiten correcciones anidadas: solo lotes "raiz" (sin padre) pueden corregirse.
  // Tampoco sobre un lote eliminado.
  puedeCorregir(): boolean {
    return !this.loteEliminado() && !this.lote()?.loteOrigenId;
  }

  validar(): void {
    this.loteService.validarLote(this.loteId()).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLote();
    });
  }

  puedeEmitir(): boolean {
    const lote = this.lote();
    return !!lote && DetalleLoteEmisionComponent.ESTADOS_EMITIBLES.includes(lote.estadoLote);
  }

  // El mismo boton/endpoint sirve para reintentar -- solo cambia el texto para dejar claro que no es
  // "la primera vez".
  esReintentoEmision(): boolean {
    const estado = this.lote()?.estadoLote;
    return estado === EstadoLoteEmision.EMITIDO_CON_ERRORES || estado === EstadoLoteEmision.ERROR_EMISION;
  }

  emitir(): void {
    const lote = this.lote();
    if (!lote) {
      return;
    }

    const esReintento = this.esReintentoEmision();

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

      const hijos = this.correccionesEliminables();
      if (hijos.length > 0) {
        this.abrirDialogoHijos(lote, hijos);
      } else {
        this.confirmarEliminacion(lote.loteId, []);
      }
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
      this.volver();
    });
  }

  abrirDialogoCorreccion(): void {
    const lote = this.lote();
    if (!lote || this.loteEnProceso()) {
      return;
    }

    const dialogRef = this.dialog.open(CargarCorreccionDialogEmisionComponent, {
      width: '500px',
      disableClose: true,
      data: {
        loteOrigenId: lote.loteId,
        nombreArchivoOrigen: lote.nombreArchivoOrigen,
      } satisfies CargarCorreccionDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmacion?: LoteEmisionConfirmacion) => {
      if (!confirmacion) {
        return;
      }

      this.mostrarExitoCorreccion(confirmacion);
    });
  }

  private mostrarExitoCorreccion(confirmacion: LoteEmisionConfirmacion): void {
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

  eliminarDetalle(detalle: LoteEmisionDetalleResponse): void {
    if (this.loteEnProceso()) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar registro',
        message: `¿Está seguro que desea eliminar la fila #${detalle.nroFila} (póliza "${detalle.nroPolizaRaw ?? '-'}") de este lote?`,
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

  // Mismo criterio que el backend (validarLotePuedeAsociarDocumentos): solo lotes que envian correo y
  // ya fueron validados. Antes de validar no hay filas OK a las que asignar nada; despues de emitir la
  // carpeta ya se borro.
  puedeGestionarDocumentos(): boolean {
    const lote = this.lote();
    return !!lote && lote.enviaCorreo
      && DetalleLoteEmisionComponent.ESTADOS_PERMITEN_DOCUMENTOS.includes(lote.estadoLote);
  }

  // Se ve en el header del panel "Documentos" aunque esté colapsado -- para que quede claro que ese
  // es el siguiente paso apenas se valida, sin tener que abrirlo primero para descubrirlo.
  documentosResumen(): string {
    const lote = this.lote();
    if (!lote) {
      return '';
    }

    if (lote.estadoLote === EstadoLoteEmision.PROCESANDO_DOCUMENTOS) {
      return 'Procesando...';
    }

    if (!this.puedeGestionarDocumentos()) {
      return lote.estadoLote === EstadoLoteEmision.CARGADO || lote.estadoLote === EstadoLoteEmision.ERROR_VALIDACION
          || lote.estadoLote === EstadoLoteEmision.VALIDANDO
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
    const dialogRef = this.dialog.open(SubirDocumentosDialogComponent, {
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

  desasignarDocumento(detalle: LoteEmisionDetalleResponse): void {
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

  getFechaCompleta(fecha: string | undefined): string {
    if (!fecha) {
      return '';
    }

    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm") ?? '';
  }
}
