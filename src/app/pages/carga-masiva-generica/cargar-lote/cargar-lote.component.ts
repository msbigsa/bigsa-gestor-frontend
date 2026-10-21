import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { distinctUntilChanged, finalize, merge, of, switchMap } from 'rxjs';

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
import {
  FORMAS_PAGO,
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

  readonly formasPago = FORMAS_PAGO;
  readonly origenesFechaPropuesta = Object.values(FechaPropuestaOrigen);
  readonly origenesFechasEmision = Object.values(FechasEmisionOrigen);
  readonly fechaPropuestaOrigenLabel = fechaPropuestaOrigenLabel;
  readonly fechasEmisionOrigenLabel = fechasEmisionOrigenLabel;

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
  readonly mostrarPlanYMoneda = computed(() => this.companiaUnica() && this.config().usaPlanYMoneda);
  readonly mostrarEmision = computed(() => this.companiaUnica() && !!this.tipoSeleccionado()?.permiteDejarEmitido);
  readonly mostrarFechasEmision = computed(() =>
    this.mostrarEmision() && !!this.valores().dejaEmitido && this.valores().fechasEmisionOrigen === FechasEmisionOrigen.PANTALLA
  );

  // Los planes de cobertura dependen de compania + negocio + ramo (los tres obligatorios en el endpoint).
  private readonly clavePlanCobertura = computed(() => {
    const v = this.valores();
    return this.mostrarPlanYMoneda() && v.ciasCodigo && v.negoCodigo && v.ramoCodigo
      ? [v.ciasCodigo, v.negoCodigo, v.ramoCodigo] as const
      : null;
  }, { equal: (a, b) => a?.join('|') === b?.join('|') });
  readonly planesCobertura = toSignal(
    toObservable(this.clavePlanCobertura).pipe(
      switchMap(clave => clave ? this.catalogoService.listarPlanesCobertura(...clave) : of([] as ItemCatalogo[])),
    ),
    { initialValue: [] as ItemCatalogo[] },
  );

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
    const faltan: string[] = [];

    if (!this.tipoSeleccionado()) {
      faltan.push('Tipo de carga');
    }

    if (this.companiaUnica()) {
      if (!v.ciasCodigo) {
        faltan.push('Compañía');
      }
      if (this.config().ramoObligatorio && !v.ramoCodigo) {
        faltan.push('Ramo');
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
    // Hoy hay un solo tipo implementado: se preselecciona, pero el combo queda visible para los que vengan.
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

    // Los negocios y planes de cobertura dependen de la compania; el plan, tambien de negocio y ramo.
    this.form.controls.ciasCodigo.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.form.patchValue({ negoCodigo: null }));
    merge(this.form.controls.negoCodigo.valueChanges, this.form.controls.ramoCodigo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.patchValue({ plcoCorrelativo: null }, { emitEvent: false }));

    // Combo_FPago_Click del VB6: al cambiar la forma de pago se limpian sus datos.
    this.form.controls.formaPago.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.form.patchValue({ ifinCodigo: null, ifinCodigoEmisor: null, nroTransaccion: null }));
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

  onArchivoRemovido(): void {
    this.archivo.set(null);
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
    if (!this.puedeEnviar()) {
      return;
    }

    this.cargando.set(true);

    this.loteService.cargarLote(this.armarFormData())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(confirmacion => this.mostrarExito(confirmacion));
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

    if (this.mostrarPlanYMoneda()) {
      agregar('plcoCorrelativo', v.plcoCorrelativo);
      agregar('domiMoneCod', v.domiMoneCod);
      agregar('usaPlanPlanilla', v.usaPlanPlanilla);
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
