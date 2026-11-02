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
import { CargaMasivaGenericaLoteService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaLote.service';
import { CargaMasivaGenericaCatalogoService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaCatalogo.service';
import { ItemCatalogo } from 'src/app/models/carga-masiva-generica/ItemCatalogo';
import { PlanPago } from 'src/app/models/carga-masiva-generica/PlanPago';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { LoteCargaConfirmacion } from 'src/app/models/carga-masiva-generica/LoteCargaConfirmacion';
import { LoteCargaDetalleResponse } from 'src/app/models/carga-masiva-generica/LoteCargaDetalleResponse';
import { EstadoLoteCarga } from 'src/app/models/carga-masiva-generica/EstadoLoteCarga';
import { EstadoDetalleCarga } from 'src/app/models/carga-masiva-generica/EstadoDetalleCarga';
import { FechaPropuestaOrigen } from 'src/app/models/carga-masiva-generica/FechaPropuestaOrigen';
import { FechasEmisionOrigen } from 'src/app/models/carga-masiva-generica/FechasEmisionOrigen';
import { CancelacionEjecucion } from 'src/app/models/carga-masiva-generica/CancelacionEjecucion';
import { LoginService } from 'src/app/services/login.service';
import { MenuService } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildDetalleLoteTourSteps } from '../carga-masiva-generica-tour.steps';
import {
  accionEjecutarLabel,
  dialogoCancelacion,
  dialogoEjecucion,
  esReintentoEjecucion,
  estadoDetalleClase,
  estadoDetalleLabel,
  estadoLoteClase,
  estadoLoteLabel,
  estadoVisibleClase,
  estadoVisibleLabel,
  fechaPropuestaOrigenLabel,
  fechasEmisionOrigenLabel,
  etiquetaInstitucion,
  etiquetaNumero,
  formaPagoLabel,
  formaPagoPideBancoEmisor,
  formaPagoPideInstitucion,
  formaPagoPideNumero,
  layoutLabel,
  loteEnProceso,
  motivosError,
  puedeCancelarEjecucion,
  puedeEjecutarLote,
  siNo,
  tieneErrorLote,
  tooltipEstadoLote,
  tooltipRegistroError,
  usuarioDescripcion,
  usuarioTexto,
} from '../shared/estados-carga-masiva.util';
import { configTipoCarga } from '../shared/tipos-carga.config';
import {
  CargarCorreccionDialogCargaMasivaComponent,
  CargarCorreccionDialogData,
} from '../shared/cargar-correccion-dialog/cargar-correccion-dialog.component';
import {
  EliminarLoteDialogCargaMasivaComponent,
  EliminarLoteDialogData,
} from '../shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import {
  ErroresRegistroDialogCargaMasivaComponent,
  ErroresRegistroDialogData,
} from '../shared/errores-registro-dialog/errores-registro-dialog.component';

const RUTA_COLA_ACTIVA = '/inicio/cola-ejecucion/cola-activa';

// Un parametro del lote para el panel "Parametros de la carga".
interface ParametroLote {
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'app-detalle-lote-carga-masiva',
  imports: [CommonModule, MaterialModule, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './detalle-lote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleLoteCargaMasivaComponent implements OnInit {

  private readonly loteService = inject(CargaMasivaGenericaLoteService);
  private readonly catalogoService = inject(CargaMasivaGenericaCatalogoService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loginService = inject(LoginService);
  private readonly menuService = inject(MenuService);
  private readonly tourService = inject(TourService);

  private static readonly INTERVALO_POLLING_MS = 5000;

  // Reactivo: se actualiza aunque Angular reutilice el componente al navegar entre detalles.
  readonly id = input.required<string>();
  readonly loteId = computed(() => Number(this.id()));

  readonly lote = signal<LoteCargaResponse | null>(null);
  readonly correcciones = signal<LoteCargaResponse[]>([]);
  // Excluye correcciones ya eliminadas.
  readonly correccionesEliminables = computed(() =>
    this.correcciones().filter(c => c.estadoLote !== EstadoLoteCarga.ELIMINADO)
  );

  // Para mostrar "codigo - nombre" de los parametros del lote.
  private readonly companias = toSignal(this.catalogoService.listarCompanias(), { initialValue: [] as ItemCatalogo[] });
  private readonly ramos = toSignal(this.catalogoService.listarRamos(), { initialValue: [] as ItemCatalogo[] });
  private readonly planesPago = toSignal(this.catalogoService.listarPlanesPago(), { initialValue: [] as PlanPago[] });

  readonly detalles = signal<LoteCargaDetalleResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstadoDetalle = signal<EstadoDetalleCarga | null>(null);

  readonly estadosDetalleDisponibles = Object.values(EstadoDetalleCarga);

  readonly parametrosExpandido = signal(false);
  readonly detalleExpandido = signal(true);

  // Endoso solo si alguna fila de la pagina lo trae.
  readonly displayedColumns = computed(() => [
    'fila',
    'poliza',
    'propuesta',
    'item',
    'compania',
    ...(this.detalles().some(d => !!d.endoso) ? ['endoso'] : []),
    'estado',
    'error',
    'accion',
  ]);

  // Agrupados por seccion, como en la pantalla de carga; solo lo que aplica al modo del lote.
  readonly parametros = computed(() => {
    const lote = this.lote();
    if (!lote) {
      return [] as { seccion: string; items: ParametroLote[] }[];
    }

    const valor = (v: string | number | undefined | null) => (v == null || v === '' ? '-' : String(v));
    const conNombre = (codigo: number | undefined, catalogo: ItemCatalogo[]) => {
      const nombre = catalogo.find(item => item.codigo === codigo)?.descripcion;
      return nombre ? `${codigo} - ${nombre}` : valor(codigo);
    };
    const fecha = (f: string | undefined) => (f ? this.datePipe.transform(f, 'dd-MM-yyyy') ?? f : '-');

    const generales: ParametroLote[] = [
      { etiqueta: 'Tipo de carga', valor: lote.tipoCargaDescripcion },
      { etiqueta: 'Layout de la planilla', valor: layoutLabel(lote.layout) },
      { etiqueta: 'Formato del archivo', valor: valor(lote.formatoArchivo) },
      { etiqueta: 'Múltiples Compañías', valor: siNo(lote.multiplesCompanias) },
    ];

    if (!lote.multiplesCompanias) {
      generales.push(
        { etiqueta: 'Compañía', valor: conNombre(lote.ciasCodigo, this.companias()) },
        { etiqueta: 'Negocio', valor: valor(lote.negoCodigo) },
        { etiqueta: 'Ramo', valor: conNombre(lote.ramoCodigo, this.ramos()) },
      );

      if (configTipoCarga(lote.tipoCarga).usaPlanYMoneda) {
        generales.push(
          { etiqueta: 'Plan de cobertura', valor: valor(lote.plcoCorrelativo) },
          { etiqueta: 'Usa plan de la planilla', valor: siNo(lote.usaPlanPlanilla) },
          { etiqueta: 'Moneda', valor: valor(lote.domiMoneCod) },
          { etiqueta: 'Usa moneda de la planilla', valor: siNo(lote.usaMonedaPlanilla) },
        );
      }

      generales.push(
        { etiqueta: 'Modifica fecha de nacimiento y sexo', valor: siNo(lote.modificaFecNacSexo) },
        {
          etiqueta: 'Fecha de propuesta',
          valor: lote.fechaPropuestaOrigen === FechaPropuestaOrigen.FIJA
            ? `Fija: ${fecha(lote.fechaPropuesta)}`
            : fechaPropuestaOrigenLabel(lote.fechaPropuestaOrigen),
        },
      );
    }

    generales.push({ etiqueta: 'Modifica dirección', valor: siNo(lote.modificaDireccion) });

    const pago: ParametroLote[] = [];
    if (!lote.multiplesCompanias) {
      pago.push({ etiqueta: 'Pago automático', valor: siNo(lote.registraPago) });
      if (lote.registraPago) {
        pago.push({ etiqueta: 'Pago por ítem', valor: siNo(lote.pagoPorItem) });
      }
    }
    pago.push(
      { etiqueta: 'Forma de pago desde la planilla', valor: siNo(lote.pagoDesdePlanilla) },
      {
        etiqueta: 'Plan de pago',
        valor: conNombre(lote.fpagCodigo, this.planesPago().map(p => ({ codigo: p.fpagCodigo, descripcion: p.descripcion }))),
      },
      { etiqueta: 'Forma de pago', valor: formaPagoLabel(lote.formaPago) },
    );
    if (formaPagoPideInstitucion(lote.formaPago)) {
      pago.push({ etiqueta: etiquetaInstitucion(lote.formaPago), valor: valor(lote.ifinCodigo) });
    }
    if (formaPagoPideBancoEmisor(lote.formaPago)) {
      pago.push({ etiqueta: 'Banco emisor', valor: valor(lote.ifinCodigoEmisor) });
    }
    if (formaPagoPideNumero(lote.formaPago)) {
      pago.push({ etiqueta: etiquetaNumero(lote.formaPago), valor: valor(lote.nroTransaccion) });
    }
    pago.push(
      { etiqueta: 'Fecha de pago', valor: fecha(lote.fechaPago) },
      { etiqueta: '% descuento', valor: valor(lote.porcDescuento) },
      { etiqueta: 'Glosa', valor: valor(lote.glosaPago) },
      {
        etiqueta: 'Vencimientos',
        valor: lote.fechasVencimiento?.length ? lote.fechasVencimiento.map(f => fecha(f)).join(' · ') : '-',
      },
    );

    const secciones = [
      { seccion: 'Datos generales', items: generales },
      { seccion: 'Forma de pago', items: pago },
    ];

    if (lote.dejaEmitido) {
      const emision: ParametroLote[] = [
        { etiqueta: 'Origen de las fechas', valor: fechasEmisionOrigenLabel(lote.fechasEmisionOrigen) },
      ];
      if (lote.fechasEmisionOrigen === FechasEmisionOrigen.PANTALLA) {
        emision.push(
          { etiqueta: 'Fecha de emisión', valor: fecha(lote.fechaEmision) },
          { etiqueta: 'Fecha de recepción', valor: fecha(lote.fechaRecepcion) },
        );
      }
      secciones.push({ seccion: 'Emisión', items: emision });
    }

    return secciones;
  });

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
  readonly layoutLabel = layoutLabel;
  readonly accionEjecutarLabel = accionEjecutarLabel;
  readonly estadoVisibleLabel = estadoVisibleLabel;
  readonly estadoVisibleClase = estadoVisibleClase;

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
    interval(DetalleLoteCargaMasivaComponent.INTERVALO_POLLING_MS)
      .pipe(
        filter(() => this.loteEnProceso()),
        exhaustMap(() => this.loteService.obtenerLote(this.loteId(), true).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(data => {
        const seguiaEnProceso = this.loteEnProceso();
        this.lote.set(data);

        // Al terminar la validacion o la ejecucion se refrescan las filas una vez mas para ver su estado final.
        if (seguiaEnProceso && !this.loteEnProceso()) {
          this.cargarDetalles(true);
        }
      });

    interval(DetalleLoteCargaMasivaComponent.INTERVALO_POLLING_MS)
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
  }

  // Usado para deshabilitar (no ocultar) acciones de mutacion mientras hay una en curso.
  loteEnProceso(): boolean {
    return loteEnProceso(this.lote());
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
    this.cargarCorrecciones();
  }

  onFiltroEstadoDetalleChange(estado: EstadoDetalleCarga | null): void {
    this.filtroEstadoDetalle.set(estado);
    this.pageIndex.set(0);

    this.cargarDetalles();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargarDetalles();
  }

  verErroresRegistro(detalle: LoteCargaDetalleResponse): void {
    this.dialog.open(ErroresRegistroDialogCargaMasivaComponent, {
      width: '480px',
      data: {
        nroFila: detalle.nroFila,
        poliza: detalle.poliza,
        motivos: this.motivosError(detalle.registroError),
      } satisfies ErroresRegistroDialogData,
    });
  }

  volver(): void {
    this.router.navigate(['/inicio/carga-masiva-generica/listar-lotes']);
  }

  irADetalleLote(loteId: number): void {
    this.router.navigate(['/inicio/carga-masiva-generica/listar-lotes/detalle-lote', loteId]);
  }

  puedeValidar(): boolean {
    const lote = this.lote();
    return (lote?.estadoLote === EstadoLoteCarga.CARGADO || lote?.estadoLote === EstadoLoteCarga.ERROR_VALIDACION)
      && (lote?.totalFilas ?? 0) > 0;
  }

  puedeEjecutar(): boolean {
    return puedeEjecutarLote(this.lote());
  }

  puedeCancelarEjecucion(): boolean {
    return puedeCancelarEjecucion(this.lote(), this.loginService.profile()?.codigo);
  }

  // Reintento o retoma: se sigue con lo que no se cargo.
  esReintento(): boolean {
    return esReintentoEjecucion(this.lote()?.estadoLote);
  }

  puedeVerEnCola(): boolean {
    return !!this.lote()?.ejecucionActiva && !!this.lote()?.idSolicitud && this.menuService.tieneAcceso(RUTA_COLA_ACTIVA);
  }

  verEnCola(): void {
    this.router.navigate([RUTA_COLA_ACTIVA], { queryParams: { solicitud: this.lote()?.idSolicitud } });
  }

  // Mientras corre, tener polizas sin cerrar es lo normal.
  polizasSinCerrar(): number {
    const lote = this.lote();
    return lote && !lote.ejecucionActiva ? lote.polizasSinCerrar ?? 0 : 0;
  }

  polizasCierreError(): number {
    return this.lote()?.polizasCierreError ?? 0;
  }

  iniciarTour(): void {
    this.tourService.start(buildDetalleLoteTourSteps(!this.loteEliminado(), this.detalles().length > 0));
  }

  ejecutar(): void {
    const lote = this.lote();
    if (lote) {
      this.confirmarEjecucion(lote, () => this.cargarLote());
    }
  }

  cancelarEjecucion(): void {
    const lote = this.lote();
    if (lote) {
      this.confirmarCancelacion(lote, () => this.actualizar());
    }
  }

  loteEliminado(): boolean {
    return this.lote()?.estadoLote === EstadoLoteCarga.ELIMINADO;
  }

  puedeEliminar(): boolean {
    return !this.loteEliminado();
  }

  // No se admiten correcciones anidadas ni sobre lotes eliminados (el backend tambien lo rechaza).
  puedeCorregir(): boolean {
    return !this.loteEliminado() && !this.lote()?.loteOrigenId;
  }

  puedeDescargar(): boolean {
    return !this.loteEliminado();
  }

  companiaFila(codigo: number | undefined): string {
    if (codigo == null) {
      return '-';
    }
    const nombre = this.companias().find(c => c.codigo === codigo)?.descripcion;
    return nombre ? `${codigo} - ${nombre}` : String(codigo);
  }

  compania(lote: LoteCargaResponse): string {
    if (lote.multiplesCompanias) {
      return 'Múltiples Compañías';
    }

    if (lote.ciasCodigo == null) {
      return 'Sin compañía';
    }

    const nombre = this.companias().find(c => c.codigo === lote.ciasCodigo)?.descripcion;
    return nombre ? `${lote.ciasCodigo} - ${nombre}` : `Compañía ${lote.ciasCodigo}`;
  }

  validar(): void {
    this.loteService.validarLote(this.loteId()).subscribe(() => {
      this.toastr.info('Validación de lote iniciada', 'En proceso');
      this.cargarLote();
    });
  }

  // La ejecucion se encola: la revalidacion y la grabacion corren cuando la cola la despacha.
  private confirmarEjecucion(lote: LoteCargaResponse, alEncolar: () => void): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      disableClose: true,
      data: dialogoEjecucion(lote),
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.ejecutarLote(lote.loteId).subscribe(encolada => {
        const posicion = encolada.posicionCola ? ` (posición ${encolada.posicionCola} en la cola)` : '';
        this.toastr.info(`Ejecución del lote encolada${posicion}`, 'En proceso');
        alEncolar();
      });
    });
  }

  private confirmarCancelacion(lote: LoteCargaResponse, alCancelar: () => void): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      disableClose: true,
      data: dialogoCancelacion(lote),
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.loteService.cancelarEjecucion(lote.loteId).subscribe({
        next: (cancelacion: CancelacionEjecucion) => {
          if (cancelacion.estado === 'CANCELADO') {
            this.toastr.success(cancelacion.mensaje, 'Ejecución cancelada');
          } else {
            this.toastr.info(cancelacion.mensaje, 'Cancelación pedida');
          }
          alCancelar();
        },
        // El interceptor muestra el rechazo; se refresca por si cambio.
        error: () => alCancelar(),
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
        this.confirmarEliminacion([]);
      }
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

  eliminarDetalle(detalle: LoteCargaDetalleResponse): void {
    if (this.loteEnProceso()) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar registro',
        message: `¿Está seguro que desea eliminar la fila #${detalle.nroFila} de este lote?`,
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

  descargarLog(): void {
    const nombre = `CargaMasivaGenerica_${this.loteId()}_${this.timestampArchivo()}.log`;
    this.loteService.descargarLog(this.loteId()).subscribe(response => this.descargarArchivo(response, nombre));
  }

  descargarResumen(): void {
    const nombre = `Resumen_${this.loteId()}_${this.timestampArchivo()}.csv`;
    this.loteService.descargarResumen(this.loteId()).subscribe(response => this.descargarArchivo(response, nombre));
  }

  // Se arma el nombre aca por si Content-Disposition no esta expuesto en el CORS del backend.
  private timestampArchivo(): string {
    return this.datePipe.transform(new Date(), 'yyyyMMdd-HHmmss') ?? '';
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

    const dialogRef = this.dialog.open(CargarCorreccionDialogCargaMasivaComponent, {
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
