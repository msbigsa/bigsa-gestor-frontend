import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { distinctUntilChanged, filter, finalize, forkJoin, map, merge, of, startWith, switchMap } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';

import { CargaMasivaGenericaLoteService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaLote.service';
import { CargaMasivaGenericaTipoCargaService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaTipoCarga.service';
import { CargaMasivaGenericaCatalogoService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaCatalogo.service';

import { TipoCargaDisponible } from 'src/app/models/carga-masiva-generica/TipoCargaDisponible';
import { LoteCargaConfirmacion } from 'src/app/models/carga-masiva-generica/LoteCargaConfirmacion';
import { FechaPropuestaOrigen } from 'src/app/models/carga-masiva-generica/FechaPropuestaOrigen';
import { FechasEmisionOrigen } from 'src/app/models/carga-masiva-generica/FechasEmisionOrigen';
import { ItemCatalogo } from 'src/app/models/carga-masiva-generica/ItemCatalogo';
import { Moneda } from 'src/app/models/carga-masiva-generica/Moneda';
import { PlanPago } from 'src/app/models/carga-masiva-generica/PlanPago';
import { AplicaSobre } from 'src/app/models/carga-masiva-generica/AplicaSobre';
import { IntermediarioCatalogo } from 'src/app/models/carga-masiva-generica/IntermediarioCatalogo';
import { RolIntermediario } from 'src/app/models/carga-masiva-generica/RolIntermediario';
import {
  FORMAS_PAGO,
  aplicaSobreLabel,
  etiquetaInstitucion,
  etiquetaNumero,
  fechaPropuestaOrigenLabel,
  fechasEmisionOrigenLabel,
  formaPagoPideBancoEmisor,
  formaPagoPideInstitucion,
  formaPagoPideNumero,
  formaPagoTipoInstitucion,
} from '../shared/estados-carga-masiva.util';
import { configTipoCarga } from '../shared/tipos-carga.config';
import {
  PRODUCTOR_POR_DEFECTO,
  RELACION_COMISION_POR_COBERTURA,
  ROLES_NUEVOS,
  ROLES_PANTALLA,
  RolPantalla,
} from '../shared/intermediarios-pantalla';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildCargarLoteTourSteps } from '../carga-masiva-generica-tour.steps';
import { OpcionCatalogo, SelectorCatalogoComponent } from '../shared/selector-catalogo/selector-catalogo.component';

// yyyy-MM-dd en hora local, el formato de <input type="date"> y el que espera el backend.
function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarMeses(fechaTexto: string, meses: number): string {
  const [anio, mes, dia] = fechaTexto.split('-').map(Number);
  return fechaIso(new Date(anio, mes - 1 + meses, dia));
}

// "a, b y c".
function enumerar(partes: string[]): string {
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes.join('');
}

// Catalogos de intermediarios y relacion de comision de una compania, negocio y ramo.
interface DatosComision {
  clave: string;
  relacion: number;
  catalogos: Partial<Record<RolIntermediario, IntermediarioCatalogo[]>>;
}

@Component({
  selector: 'app-cargar-lote-carga-masiva',
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FileDropzoneComponent,
    SelectorCatalogoComponent,
  ],
  templateUrl: './cargar-lote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargarLoteCargaMasivaComponent {

  private readonly loteService = inject(CargaMasivaGenericaLoteService);
  private readonly tipoCargaService = inject(CargaMasivaGenericaTipoCargaService);
  private readonly catalogoService = inject(CargaMasivaGenericaCatalogoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly tourService = inject(TourService);

  readonly formasPago = FORMAS_PAGO;
  readonly origenesFechaPropuesta = Object.values(FechaPropuestaOrigen);
  readonly origenesFechasEmision = Object.values(FechasEmisionOrigen);
  readonly fechaPropuestaOrigenLabel = fechaPropuestaOrigenLabel;
  readonly fechasEmisionOrigenLabel = fechasEmisionOrigenLabel;
  readonly aplicaSobreLabel = aplicaSobreLabel;
  readonly rolesPantalla = ROLES_PANTALLA;
  readonly rolesNuevos = ROLES_NUEVOS;

  readonly tiposCarga = toSignal(this.tipoCargaService.listarDisponibles(), { initialValue: [] as TipoCargaDisponible[] });
  readonly tipoSeleccionado = signal<TipoCargaDisponible | null>(null);
  readonly config = computed(() => configTipoCarga(this.tipoSeleccionado()?.tipoCarga));

  readonly companias = toSignal(this.catalogoService.listarCompanias(), { initialValue: [] as ItemCatalogo[] });
  readonly ramos = toSignal(this.catalogoService.listarRamos(), { initialValue: [] as ItemCatalogo[] });
  readonly monedas = toSignal(this.catalogoService.listarMonedas(), { initialValue: [] as Moneda[] });
  readonly planesPago = toSignal(this.catalogoService.listarPlanesPago(), { initialValue: [] as PlanPago[] });
  readonly tarjetas = toSignal(this.catalogoService.listarInstituciones(1), { initialValue: [] as ItemCatalogo[] });
  readonly bancos = toSignal(this.catalogoService.listarInstituciones(2), { initialValue: [] as ItemCatalogo[] });
  readonly opcionesPlanesPago = computed<OpcionCatalogo[]>(() =>
    this.planesPago().map(plan => ({ codigo: plan.fpagCodigo, descripcion: plan.descripcion }))
  );

  // Los defaults replican SolicitaDatos.frm: "Multiples Companias" y "usar planilla para la forma de pago" marcadas.
  readonly form = new FormGroup({
    multiplesCompanias: new FormControl(true, { nonNullable: true }),
    ciasCodigo: new FormControl<number | null>(null),
    negoCodigo: new FormControl<number | null>(null),
    ramoCodigo: new FormControl<number | null>(null),
    plcoCorrelativo: new FormControl<number | null>(null),
    domiMoneCod: new FormControl<string | null>(null),
    usaPlanPlanilla: new FormControl(false, { nonNullable: true }),
    usaMonedaPlanilla: new FormControl(false, { nonNullable: true }),
    modificaFecNacSexo: new FormControl(false, { nonNullable: true }),
    modificaDireccion: new FormControl(false, { nonNullable: true }),

    fechaPropuestaOrigen: new FormControl(FechaPropuestaOrigen.INICIO_VIGENCIA, { nonNullable: true }),
    fechaPropuesta: new FormControl<string | null>(null),

    dejaEmitido: new FormControl(false, { nonNullable: true }),
    fechasEmisionOrigen: new FormControl(FechasEmisionOrigen.PANTALLA, { nonNullable: true }),
    fechaEmision: new FormControl<string | null>(null),
    fechaRecepcion: new FormControl<string | null>(null),

    // Carga 1: reemplazan al organizador / cobrador de la poliza.
    nuevoOrganizador: new FormControl(false, { nonNullable: true }),
    nuevoCobrador: new FormControl(false, { nonNullable: true }),

    // Intermediarios de pantalla (carga 2); el organizador y el cobrador tambien los usa la carga 1.
    codProductor: new FormControl<number | null>(null),
    porComProductor: new FormControl<number | null>(null),
    aplicaProductor: new FormControl<AplicaSobre | null>(null),
    codOrganizador: new FormControl<number | null>(null),
    porComOrganizador: new FormControl<number | null>(null),
    aplicaOrganizador: new FormControl<AplicaSobre | null>(null),
    codIntermediario: new FormControl<number | null>(null),
    porComIntermediario: new FormControl<number | null>(null),
    aplicaIntermediario: new FormControl<AplicaSobre | null>(null),
    codAgencia: new FormControl<number | null>(null),
    porComAgencia: new FormControl<number | null>(null),
    aplicaAgencia: new FormControl<AplicaSobre | null>(null),
    codEjecutivo: new FormControl<number | null>(null),
    porComEjecutivo: new FormControl<number | null>(null),
    aplicaEjecutivo: new FormControl<AplicaSobre | null>(null),
    codCobrador: new FormControl<number | null>(null),
    porComCobrador: new FormControl<number | null>(null),
    aplicaCobrador: new FormControl<AplicaSobre | null>(null),

    registraPago: new FormControl(false, { nonNullable: true }),
    pagoPorItem: new FormControl(false, { nonNullable: true }),
    pagoDesdePlanilla: new FormControl(true, { nonNullable: true }),
    fpagCodigo: new FormControl<number | null>(null),
    formaPago: new FormControl<number | null>(null),
    ifinCodigo: new FormControl<number | null>(null),
    ifinCodigoEmisor: new FormControl<number | null>(null),
    nroTransaccion: new FormControl<string | null>(null),
    // En "Multiples Companias" el backend la exige por fila: se propone la del dia.
    fechaPago: new FormControl<string | null>(fechaIso(new Date())),
    porcDescuento: new FormControl<number | null>(null),
    glosaPago: new FormControl<string | null>(null),
    fechasVencimiento: new FormArray<FormControl<string | null>>([]),
  });

  readonly vencimientos = this.form.controls.fechasVencimiento;

  readonly negocios = toSignal(
    this.form.controls.ciasCodigo.valueChanges.pipe(
      distinctUntilChanged(),
      switchMap(cia => cia ? this.catalogoService.listarNegocios(cia) : of([] as ItemCatalogo[])),
    ),
    { initialValue: [] as ItemCatalogo[] },
  );

  readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly multiplesCompanias = computed(() =>
    !!this.tipoSeleccionado()?.permiteMultiplesCompanias && !!this.valores().multiplesCompanias
  );
  readonly companiaUnica = computed(() => !this.multiplesCompanias());

  // Con "Multiples Companias" el VB6 encoge la pantalla a tipo + archivo: el resto queda oculto con sus defaults.
  readonly mostrarPlan = computed(() => this.companiaUnica() && this.config().usaPlan);
  readonly mostrarMoneda = computed(() => this.companiaUnica() && this.config().usaMoneda);
  readonly mostrarEmision = computed(() => this.companiaUnica() && !!this.tipoSeleccionado()?.permiteDejarEmitido);
  readonly mostrarFechasEmision = computed(() =>
    this.mostrarEmision() && !!this.valores().dejaEmitido && this.valores().fechasEmisionOrigen === FechasEmisionOrigen.PANTALLA
  );
  readonly mostrarNuevosIntermediarios = computed(() =>
    this.companiaUnica() && !!this.tipoSeleccionado()?.permiteNuevosIntermediarios
  );
  readonly mostrarIntermediarios = computed(() => this.companiaUnica() && this.config().intermediariosPantalla);

  readonly textoMultiplesCompanias = computed(() => {
    const tipo = this.tipoSeleccionado();
    const campos = ['Compañía', 'negocio', 'ramo', 'plan', 'moneda', 'pago automático', 'pago por ítem',
      'fecha de nacimiento', 'fecha de propuesta'];
    if (tipo?.permiteDejarEmitido) {
      campos.push('dejar emitido con sus fechas');
    }
    if (this.config().intermediariosPantalla) {
      campos.push('intermediarios');
    }
    const nuevos = tipo?.permiteNuevosIntermediarios ? ' No se usa nuevo organizador ni nuevo cobrador.' : '';

    return `${enumerar(campos)} se leen de cada fila de la planilla. La forma de pago se toma de la planilla y la `
      + `fecha de pago es la de hoy.${nuevos}`;
  });

  // Compania + negocio + ramo: de ellos dependen los planes, los intermediarios y la relacion de comision.
  private readonly claveCnr = computed(() => {
    const v = this.valores();
    return this.companiaUnica() && v.ciasCodigo && v.negoCodigo && v.ramoCodigo
      ? [v.ciasCodigo, v.negoCodigo, v.ramoCodigo] as const
      : null;
  }, { equal: (a, b) => a?.join('|') === b?.join('|') });
  readonly hayClaveCnr = computed(() => !!this.claveCnr());

  readonly planesCobertura = toSignal(
    toObservable(computed(() => this.mostrarPlan() ? this.claveCnr() : null)).pipe(
      switchMap(clave => clave ? this.catalogoService.listarPlanesCobertura(...clave) : of([] as ItemCatalogo[])),
    ),
    { initialValue: [] as ItemCatalogo[] },
  );

  private readonly rolesConCatalogo = computed<RolIntermediario[]>(() => {
    if (this.mostrarIntermediarios()) {
      return ROLES_PANTALLA.map(r => r.rol);
    }
    return this.mostrarNuevosIntermediarios() ? ROLES_NUEVOS.map(r => r.rol) : [];
  });

  private readonly consultaComision = computed(() => {
    const clave = this.claveCnr();
    const roles = this.rolesConCatalogo();
    return clave && roles.length ? { clave, roles } : null;
  }, { equal: (a, b) => a?.clave.join('|') === b?.clave.join('|') && a?.roles.join('|') === b?.roles.join('|') });

  private readonly datosComision = toSignal(
    toObservable(this.consultaComision).pipe(
      switchMap(consulta => !consulta ? of(null) : forkJoin({
        relacion: this.catalogoService.obtenerRelacionComision(...consulta.clave).pipe(map(r => r.relacionComision)),
        catalogos: forkJoin(Object.fromEntries(
          consulta.roles.map(rol => [rol, this.catalogoService.listarIntermediarios(...consulta.clave, rol)])
        )),
      }).pipe(
        map((datos): DatosComision => ({ clave: consulta.clave.join('|'), ...datos })),
        startWith(null),
      )),
    ),
    { initialValue: null },
  );

  readonly relacionComision = computed(() => this.datosComision()?.relacion ?? 1);
  readonly comisionPorCobertura = computed(() => this.relacionComision() === RELACION_COMISION_POR_COBERTURA);
  readonly opcionesIntermediarios = computed<Partial<Record<RolIntermediario, IntermediarioCatalogo[]>>>(() =>
    this.datosComision()?.catalogos ?? {}
  );

  // validaCobeComisiones: relacion 2 con plan y los seis intermediarios, la comision es por cobertura y no se ingresa.
  readonly comisionSoloPorCobertura = computed(() => {
    const v = this.valores();
    return this.mostrarIntermediarios() && this.comisionPorCobertura() && !!v.plcoCorrelativo
      && ROLES_PANTALLA.every(r => !!v[r.campoCodigo]);
  });

  // % propuesto por rol: cambiarlo pide confirmacion.
  private readonly porcentajesPropuestos = new Map<RolIntermediario, number | null>();
  private productorPropuestoPara: string | null = null;
  private confirmandoPorcentaje = false;
  private soloPorCoberturaAnterior = false;

  readonly planPagoSeleccionado = computed(() =>
    this.planesPago().find(plan => plan.fpagCodigo === this.valores().fpagCodigo) ?? null
  );
  readonly cuotasPlan = computed(() => this.planPagoSeleccionado()?.numeroCuotas ?? 0);

  readonly pagoAutomatico = computed(() => this.companiaUnica() && !!this.valores().registraPago);
  readonly formaPagoObligatoria = computed(() => this.companiaUnica() && !this.valores().pagoDesdePlanilla);
  // Ing_Fechas: pago automatico, sin planilla y plan en cuotas.
  readonly mostrarVencimientos = computed(() =>
    this.pagoAutomatico() && !this.valores().pagoDesdePlanilla && this.cuotasPlan() > 0
  );
  // Ing_FormaPago: al elegir una forma se exigen sus datos.
  readonly pideInstitucion = computed(() => formaPagoPideInstitucion(this.valores().formaPago));
  readonly pideBancoEmisor = computed(() => formaPagoPideBancoEmisor(this.valores().formaPago));
  readonly pideNumero = computed(() => formaPagoPideNumero(this.valores().formaPago));
  readonly etiquetaInstitucion = computed(() => etiquetaInstitucion(this.valores().formaPago));
  readonly etiquetaNumero = computed(() => etiquetaNumero(this.valores().formaPago));
  readonly opcionesInstitucion = computed(() =>
    formaPagoTipoInstitucion(this.valores().formaPago) === 1 ? this.tarjetas() : this.bancos()
  );

  readonly archivo = signal<File | null>(null);
  readonly cargando = signal(false);

  // Replica las validaciones de pantalla del backend, para no mandar una carga que va a rechazar.
  readonly faltantes = computed(() => {
    const v = this.valores();
    const config = this.config();
    const faltan: string[] = [];

    if (!this.tipoSeleccionado()) {
      faltan.push('Tipo de carga');
    }

    if (this.companiaUnica()) {
      if (!v.ciasCodigo) {
        faltan.push('Compañía');
      }
      if (config.negocioObligatorio && !v.negoCodigo) {
        faltan.push('Negocio');
      }
      if (config.ramoObligatorio && !v.ramoCodigo) {
        faltan.push('Ramo');
      }
      if (this.mostrarPlan() && config.planObligatorio && !v.plcoCorrelativo && !v.usaPlanPlanilla) {
        faltan.push('Plan de cobertura');
      }
      if (this.mostrarMoneda() && config.monedaObligatoria && !v.domiMoneCod && !v.usaMonedaPlanilla) {
        faltan.push('Moneda');
      }
      if (this.mostrarIntermediarios() && !v.codProductor) {
        faltan.push('Productor');
      }
      if (this.mostrarNuevosIntermediarios() && v.nuevoOrganizador && !v.codOrganizador) {
        faltan.push('Organizador');
      }
      if (this.mostrarNuevosIntermediarios() && v.nuevoCobrador && !v.codCobrador) {
        faltan.push('Cobrador');
      }
      if (v.registraPago && !v.fechaPago) {
        faltan.push('Fecha de pago');
      }
      if (v.fechaPropuestaOrigen === FechaPropuestaOrigen.FIJA && !v.fechaPropuesta) {
        faltan.push('Fecha de propuesta');
      }
    }

    if (this.formaPagoObligatoria()) {
      if (!v.fpagCodigo) {
        faltan.push('Plan de pago');
      }
      if (v.formaPago == null) {
        faltan.push('Forma de pago');
      }
    }

    if (this.companiaUnica()) {
      if (this.pideInstitucion() && !v.ifinCodigo) {
        faltan.push(this.etiquetaInstitucion());
      }
      if (this.pideBancoEmisor() && !v.ifinCodigoEmisor) {
        faltan.push('Banco emisor');
      }
      if (this.pideNumero() && !v.nroTransaccion?.trim()) {
        faltan.push(this.etiquetaNumero());
      }
    }

    if (this.mostrarVencimientos()) {
      const fechas = v.fechasVencimiento ?? [];
      if (fechas.some(f => !f)) {
        faltan.push('Fechas de vencimiento incompletas');
      } else if (fechas.some((f, i) => i > 0 && f! < fechas[i - 1]!)) {
        faltan.push('Fechas de vencimiento en orden no decreciente');
      }
    }

    if (this.mostrarFechasEmision()) {
      if (!v.fechaEmision) {
        faltan.push('Fecha de emisión');
      }
      if (!v.fechaRecepcion) {
        faltan.push('Fecha de recepción');
      }
      if (v.fechaEmision && v.fechaRecepcion && v.fechaRecepcion < v.fechaEmision) {
        faltan.push('Fecha de recepción mayor o igual a la de emisión');
      }
    }

    if (!this.archivo()) {
      faltan.push('Archivo');
    }

    return faltan;
  });

  readonly puedeEnviar = computed(() => this.faltantes().length === 0 && !this.cargando());

  constructor() {
    // Con un solo tipo implementado se preselecciona, pero el combo queda visible.
    effect(() => {
      const tipos = this.tiposCarga();

      untracked(() => {
        if (tipos.length === 1 && !this.tipoSeleccionado()) {
          this.onTipoCargaChange(tipos[0]);
        }
      });
    });

    // Ing_Fechas: cuota x = fecha de pago + x meses; se rearma al cambiar el plan o la fecha de pago.
    const claveVencimientos = computed(() =>
      this.mostrarVencimientos() ? `${this.cuotasPlan()}|${this.valores().fechaPago ?? ''}` : ''
    );
    effect(() => {
      const clave = claveVencimientos();

      untracked(() => this.armarVencimientos(clave ? this.cuotasPlan() : 0));
    });

    // Al pasar a "Multiples Companias" no debe viajar nada de lo llenado en compania unica.
    this.form.controls.multiplesCompanias.valueChanges
      .pipe(distinctUntilChanged(), filter(Boolean), takeUntilDestroyed())
      .subscribe(() => this.limpiarCompaniaUnica());

    // Los negocios y planes de cobertura dependen de la compania; el plan, tambien de negocio y ramo.
    this.form.controls.ciasCodigo.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.form.patchValue({ negoCodigo: null }));
    merge(this.form.controls.negoCodigo.valueChanges, this.form.controls.ramoCodigo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.patchValue({ plcoCorrelativo: null }, { emitEvent: false }));

    // Check_usaPlan / Check_usaMoneda: usar el de la planilla y elegir uno en pantalla se excluyen.
    this.form.controls.usaPlanPlanilla.valueChanges.pipe(filter(Boolean), takeUntilDestroyed())
      .subscribe(() => this.form.controls.plcoCorrelativo.setValue(null));
    this.form.controls.plcoCorrelativo.valueChanges.pipe(filter(plan => plan != null), takeUntilDestroyed())
      .subscribe(() => this.form.controls.usaPlanPlanilla.setValue(false));
    this.form.controls.usaMonedaPlanilla.valueChanges.pipe(filter(Boolean), takeUntilDestroyed())
      .subscribe(() => this.form.controls.domiMoneCod.setValue(null));
    this.form.controls.domiMoneCod.valueChanges.pipe(filter(moneda => moneda != null), takeUntilDestroyed())
      .subscribe(() => this.form.controls.usaMonedaPlanilla.setValue(false));

    // Combo_FPago_Click del VB6: al cambiar la forma de pago se limpian sus datos.
    this.form.controls.formaPago.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.form.patchValue({ ifinCodigo: null, ifinCodigoEmisor: null, nroTransaccion: null }));

    // NomRam_Change: al cambiar compania, negocio o ramo se reinician los intermediarios.
    toObservable(this.claveCnr).pipe(map(clave => clave?.join('|') ?? null), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(clave => this.reiniciarIntermediarios(clave));

    // validaCobeComisiones: al elegir un intermediario se propone su % y "aplica sobre".
    for (const rol of ROLES_PANTALLA) {
      this.form.controls[rol.campoCodigo].valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed())
        .subscribe(codigo => this.proponerComision(rol, codigo));
    }

    // El productor por defecto se propone cuando llega el catalogo de la compania, negocio y ramo.
    effect(() => {
      const datos = this.datosComision();

      untracked(() => this.proponerProductorPorDefecto(datos));
    });

    effect(() => {
      const soloPorCobertura = this.comisionSoloPorCobertura();

      untracked(() => this.aplicarComisionPorCobertura(soloPorCobertura));
    });
  }

  onTipoCargaChange(tipo: TipoCargaDisponible): void {
    this.tipoSeleccionado.set(tipo);

    this.form.patchValue({
      multiplesCompanias: tipo.permiteMultiplesCompanias,
      dejaEmitido: false,
    });
  }

  onArchivoSeleccionado(file: File): void {
    this.archivo.set(file);
  }

  iniciarTour(): void {
    const tipo = this.tipoSeleccionado();
    this.tourService.start(buildCargarLoteTourSteps({
      hayTipo: !!tipo,
      permiteMultiplesCompanias: !!tipo?.permiteMultiplesCompanias,
      companiaUnica: this.companiaUnica(),
      mostrarPlan: this.mostrarPlan(),
      mostrarMoneda: this.mostrarMoneda(),
      mostrarEmision: this.mostrarEmision(),
      mostrarNuevosIntermediarios: this.mostrarNuevosIntermediarios(),
      mostrarIntermediarios: this.mostrarIntermediarios(),
    }));
  }

  onArchivoRemovido(): void {
    this.archivo.set(null);
  }

  // msk_campo_LostFocus: cambiar el % propuesto pide confirmacion; si no, vuelve al propuesto.
  confirmarCambioPorcentaje(rol: RolPantalla): void {
    const control = this.form.controls[rol.campoPorcentaje];
    if (this.confirmandoPorcentaje || !this.porcentajesPropuestos.has(rol.rol)) {
      return;
    }

    const propuesto = this.porcentajesPropuestos.get(rol.rol) ?? null;
    if (control.value === propuesto) {
      return;
    }

    this.confirmandoPorcentaje = true;
    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Comisiones',
        message: `¿Está seguro de que quiere modificar el % de comisión programado en BO (${propuesto ?? 'vacío'}) `
          + `por el % de comisión ingresado (${control.value ?? 'vacío'}) para el ${rol.etiqueta.toLowerCase()}?`,
        confirmText: 'Modificar',
        cancelText: 'Mantener el programado',
        type: 'warning',
      },
    }).afterClosed().subscribe(resultado => {
      this.confirmandoPorcentaje = false;

      if (resultado === ConfirmDialogResult.CONFIRM) {
        this.porcentajesPropuestos.set(rol.rol, control.value);
      } else {
        control.setValue(propuesto);
      }
    });
  }

  private reiniciarIntermediarios(clave: string | null): void {
    this.porcentajesPropuestos.clear();
    this.productorPropuestoPara = null;

    for (const rol of ROLES_PANTALLA) {
      this.form.controls[rol.campoCodigo].setValue(null);
      this.form.controls[rol.campoPorcentaje].setValue(null);
      this.form.controls[rol.campoAplica].setValue(null);
    }

    // Chk_NuevoOrganizador / Chk_NuevoCobrador: solo con compania, negocio y ramo.
    for (const control of [this.form.controls.nuevoOrganizador, this.form.controls.nuevoCobrador]) {
      if (clave) {
        control.enable();
      } else {
        control.setValue(false);
        control.disable();
      }
    }
  }

  private proponerComision(rol: RolPantalla, codigo: number | null): void {
    const porcentaje = this.form.controls[rol.campoPorcentaje];
    const aplica = this.form.controls[rol.campoAplica];

    if (codigo == null) {
      this.porcentajesPropuestos.delete(rol.rol);
      porcentaje.setValue(null);
      aplica.setValue(null);
      return;
    }

    if (this.comisionSoloPorCobertura()) {
      return;
    }

    if (this.comisionPorCobertura()) {
      this.porcentajesPropuestos.set(rol.rol, 0);
      porcentaje.setValue(0);
      aplica.setValue(null);
      return;
    }

    const nominal = this.opcionesIntermediarios()[rol.rol]?.find(item => item.codigo === codigo);
    if (nominal) {
      this.porcentajesPropuestos.set(rol.rol, nominal.porcentaje ?? null);
      porcentaje.setValue(nominal.porcentaje ?? null);
      aplica.setValue(nominal.aplicaSobre ?? null);
    }
  }

  private proponerProductorPorDefecto(datos: DatosComision | null): void {
    const clave = this.claveCnr()?.join('|');
    if (!datos || datos.clave !== clave || this.productorPropuestoPara === clave || !this.mostrarIntermediarios()) {
      return;
    }

    this.productorPropuestoPara = clave;
    const productores = datos.catalogos[RolIntermediario.PROD] ?? [];
    if (this.form.controls.codProductor.value == null && productores.some(p => p.codigo === PRODUCTOR_POR_DEFECTO)) {
      this.form.controls.codProductor.setValue(PRODUCTOR_POR_DEFECTO);
    }
  }

  // Los % y el "aplica sobre" quedan vacios y bloqueados, y "usar plan de la planilla" desmarcada y bloqueada.
  private aplicarComisionPorCobertura(soloPorCobertura: boolean): void {
    const controles = [
      ...ROLES_PANTALLA.map(r => this.form.controls[r.campoPorcentaje]),
      ...ROLES_PANTALLA.map(r => this.form.controls[r.campoAplica]),
      this.form.controls.usaPlanPlanilla,
    ];

    if (soloPorCobertura) {
      this.porcentajesPropuestos.clear();
      this.form.controls.usaPlanPlanilla.setValue(false);
      ROLES_PANTALLA.forEach(r => {
        this.form.controls[r.campoPorcentaje].setValue(null);
        this.form.controls[r.campoAplica].setValue(null);
      });
      controles.forEach(control => control.disable());
    } else {
      controles.forEach(control => control.enable());
      // Al salir de ese caso los % vuelven a proponerse.
      if (this.soloPorCoberturaAnterior) {
        ROLES_PANTALLA.forEach(r => this.proponerComision(r, this.form.controls[r.campoCodigo].value));
      }
    }
    this.soloPorCoberturaAnterior = soloPorCobertura;
  }

  // Deja la pantalla como recien abierta, salvo el modo.
  private limpiarCompaniaUnica(): void {
    this.form.reset({
      multiplesCompanias: true,
      pagoDesdePlanilla: true,
      fechaPago: fechaIso(new Date()),
    });
    this.vencimientos.clear();
  }

  private armarVencimientos(cuotas: number): void {
    const base = this.form.controls.fechaPago.value;

    this.vencimientos.clear({ emitEvent: false });
    for (let i = 1; i <= cuotas; i++) {
      this.vencimientos.push(new FormControl<string | null>(base ? sumarMeses(base, i) : null), { emitEvent: false });
    }
    this.vencimientos.updateValueAndValidity();
  }

  enviar(): void {
    // El blur del % pudo abrir su confirmacion justo antes del clic.
    if (!this.puedeEnviar() || this.confirmandoPorcentaje) {
      return;
    }

    this.confirmarPorcentajesEnCero(this.nuevosConPorcentajeEnCero(), () => {
      this.cargando.set(true);

      this.loteService.cargarLote(this.armarFormData())
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe(confirmacion => this.mostrarExito(confirmacion));
    });
  }

  // Nuevo organizador / cobrador marcado con % vacio o 0 (SolicitaDatos.frm, "¿Desea Continuar?").
  private nuevosConPorcentajeEnCero(): RolPantalla[] {
    if (!this.mostrarNuevosIntermediarios()) {
      return [];
    }

    const v = this.form.getRawValue();
    return ROLES_NUEVOS.filter(rol =>
      (rol.rol === RolIntermediario.ORGA ? v.nuevoOrganizador : v.nuevoCobrador) && !v[rol.campoPorcentaje]
    );
  }

  private confirmarPorcentajesEnCero(pendientes: RolPantalla[], continuar: () => void): void {
    const [rol, ...resto] = pendientes;
    if (!rol) {
      continuar();
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: `Porcentaje de ${rol.etiqueta.toLowerCase()}`,
        message: `Porcentaje de ${rol.etiqueta} es 0, ¿desea continuar?`,
        confirmText: 'Continuar',
        cancelText: 'Volver',
        type: 'warning',
      },
    }).afterClosed().subscribe(resultado => {
      if (resultado === ConfirmDialogResult.CONFIRM) {
        this.form.controls[rol.campoPorcentaje].setValue(0);
        this.confirmarPorcentajesEnCero(resto, continuar);
      }
    });
  }

  // Solo viajan los campos que aplican al tipo y modo elegidos; el backend aplica sus defaults al resto.
  private armarFormData(): FormData {
    const v = this.form.getRawValue();
    const formData = new FormData();

    const agregar = (campo: string, valor: string | number | boolean | null | undefined) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        formData.append(campo, String(valor));
      }
    };

    formData.append('archivo', this.archivo()!);
    agregar('tipoCarga', this.tipoSeleccionado()!.tipoCarga);
    agregar('multiplesCompanias', this.multiplesCompanias());

    // Defaults de los controles ocultos del VB6: planilla para la forma de pago y fecha de pago del dia.
    if (this.multiplesCompanias()) {
      agregar('pagoDesdePlanilla', true);
      agregar('fechaPago', fechaIso(new Date()));
      return formData;
    }

    agregar('modificaDireccion', v.modificaDireccion);
    agregar('ciasCodigo', v.ciasCodigo);
    agregar('negoCodigo', v.negoCodigo);
    agregar('ramoCodigo', v.ramoCodigo);
    agregar('modificaFecNacSexo', v.modificaFecNacSexo);
    agregar('fechaPropuestaOrigen', v.fechaPropuestaOrigen);
    if (v.fechaPropuestaOrigen === FechaPropuestaOrigen.FIJA) {
      agregar('fechaPropuesta', v.fechaPropuesta);
    }
    agregar('registraPago', v.registraPago);
    if (v.registraPago) {
      agregar('pagoPorItem', v.pagoPorItem);
      agregar('fechaPago', v.fechaPago);
    }

    if (this.mostrarPlan()) {
      agregar('plcoCorrelativo', v.plcoCorrelativo);
      agregar('usaPlanPlanilla', v.usaPlanPlanilla);
    }

    if (this.mostrarMoneda()) {
      agregar('domiMoneCod', v.domiMoneCod);
      agregar('usaMonedaPlanilla', v.usaMonedaPlanilla);
    }

    if (this.mostrarEmision() && v.dejaEmitido) {
      agregar('dejaEmitido', true);
      agregar('fechasEmisionOrigen', v.fechasEmisionOrigen);
      if (v.fechasEmisionOrigen === FechasEmisionOrigen.PANTALLA) {
        agregar('fechaEmision', v.fechaEmision);
        agregar('fechaRecepcion', v.fechaRecepcion);
      }
    }

    if (this.mostrarNuevosIntermediarios()) {
      if (v.nuevoOrganizador) {
        agregar('nuevoOrganizador', true);
        agregar('codOrganizador', v.codOrganizador);
        agregar('porComOrganizador', v.porComOrganizador);
      }
      if (v.nuevoCobrador) {
        agregar('nuevoCobrador', true);
        agregar('codCobrador', v.codCobrador);
        agregar('porComCobrador', v.porComCobrador);
      }
    }

    if (this.mostrarIntermediarios()) {
      for (const rol of ROLES_PANTALLA) {
        agregar(rol.campoCodigo, v[rol.campoCodigo]);
        agregar(rol.campoPorcentaje, v[rol.campoPorcentaje]);
        agregar(rol.campoAplica, v[rol.campoAplica]);
      }
    }

    agregar('pagoDesdePlanilla', v.pagoDesdePlanilla);
    agregar('fpagCodigo', v.fpagCodigo);
    agregar('formaPago', v.formaPago);
    if (formaPagoPideInstitucion(v.formaPago)) {
      agregar('ifinCodigo', v.ifinCodigo);
    }
    if (formaPagoPideBancoEmisor(v.formaPago)) {
      agregar('ifinCodigoEmisor', v.ifinCodigoEmisor);
    }
    if (formaPagoPideNumero(v.formaPago)) {
      agregar('nroTransaccion', v.nroTransaccion?.trim());
    }
    agregar('porcDescuento', v.porcDescuento);
    agregar('glosaPago', v.glosaPago);

    if (this.mostrarVencimientos()) {
      v.fechasVencimiento.forEach(fecha => agregar('fechasVencimiento', fecha));
    }

    return formData;
  }

  private mostrarExito(confirmacion: LoteCargaConfirmacion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Lote cargado exitosamente',
        message: `Se cargaron ${confirmacion.totalFilas} filas del archivo "${confirmacion.nombreArchivoOrigen}" (lote #${confirmacion.loteId}).`,
        confirmText: 'Aceptar',
        type: 'success',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      // Se navega tras la respuesta para que la lista ya muestre VALIDANDO y active el polling.
      this.loteService.validarLote(confirmacion.loteId).subscribe(() => {
        this.router.navigate(['/inicio/carga-masiva-generica/listar-lotes']);
      });
    });
  }
}
