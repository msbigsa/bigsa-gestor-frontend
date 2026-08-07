import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, combineLatest, finalize, map, startWith } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';

import { AvisoCobranzaLoteService } from 'src/app/services/aviso-cobranza/avisoCobranzaLote.service';
import { AvisoCobranzaCobradorService } from 'src/app/services/aviso-cobranza/avisoCobranzaCobrador.service';
import { AvisoCobranzaCompaniaService } from 'src/app/services/aviso-cobranza/avisoCobranzaCompania.service';
import { AvisoCobranzaPlantillaService } from 'src/app/services/aviso-cobranza/avisoCobranzaPlantilla.service';

import { CobradorDisponible } from 'src/app/models/aviso-cobranza/CobradorDisponible';
import { CompaniaDisponible } from 'src/app/models/aviso-cobranza/CompaniaDisponible';
import { FormatoDisponible } from 'src/app/models/aviso-cobranza/FormatoDisponible';
import { LoteCargaConfirmacion } from 'src/app/models/aviso-cobranza/LoteCargaConfirmacion';

@Component({
  selector: 'app-cargar-lote',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    FileDropzoneComponent,
  ],
  templateUrl: './cargar-lote.component.html',
  styleUrl: './cargar-lote.component.scss',
})
export class CargarLoteComponent implements OnInit {

  private readonly loteService = inject(AvisoCobranzaLoteService);
  private readonly cobradorService = inject(AvisoCobranzaCobradorService);
  private readonly companiaService = inject(AvisoCobranzaCompaniaService);
  private readonly plantillaService = inject(AvisoCobranzaPlantillaService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly companias = signal<CompaniaDisponible[]>([]);
  readonly plantillas = signal<FormatoDisponible[]>([]);
  readonly cobradores = signal<CobradorDisponible[]>([]);

  // Compañía
  readonly ciaControl = new FormControl<string | CompaniaDisponible>('', { nonNullable: true });
  readonly ciaSeleccionada = signal<CompaniaDisponible | null>(null);
  readonly ciasFiltradas: Observable<CompaniaDisponible[]> = combineLatest([
    toObservable(this.companias),
    this.ciaControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([companias, valor]) => this.filtrar(companias, this.textoCia, valor)),
  );

  // Plantilla de cliente
  readonly plantillaClienteControl = new FormControl<string | FormatoDisponible>('', { nonNullable: true });
  readonly plantillaClienteSeleccionada = signal<FormatoDisponible | null>(null);
  readonly plantillasClienteFiltradas: Observable<FormatoDisponible[]> = combineLatest([
    toObservable(this.plantillas),
    this.plantillaClienteControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([plantillas, valor]) => this.filtrar(plantillas, p => p.formNombre, valor)),
  );

  // Plantilla de ejecutivo
  readonly plantillaEjecutivoControl = new FormControl<string | FormatoDisponible>('', { nonNullable: true });
  readonly plantillaEjecutivoSeleccionada = signal<FormatoDisponible | null>(null);
  readonly plantillasEjecutivoFiltradas: Observable<FormatoDisponible[]> = combineLatest([
    toObservable(this.plantillas),
    this.plantillaEjecutivoControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([plantillas, valor]) => this.filtrar(plantillas, p => p.formNombre, valor)),
  );

  // Todos marcados por defecto
  readonly filtroCobrador = signal('');
  readonly cobradoresSeleccionados = signal<Set<number>>(new Set());
  readonly cobradoresFiltrados = computed(() => {
    const filtro = this.filtroCobrador().trim().toLowerCase();

    if (!filtro) {
      return this.cobradores();
    }

    return this.cobradores().filter(c => c.persRazonSocial.toLowerCase().includes(filtro));
  });

  readonly copiaCobrador = signal(false);
  readonly copiaEjecutivo = signal(false);
  readonly excluirDescuentoPlanilla = signal(false);

  readonly archivo = signal<File | null>(null);

  readonly cargando = signal(false);

  readonly puedeEnviar = computed(() =>
    this.ciaSeleccionada() !== null &&
    this.plantillaClienteSeleccionada() !== null &&
    this.plantillaEjecutivoSeleccionada() !== null &&
    this.archivo() !== null &&
    this.cobradoresSeleccionados().size > 0 &&
    !this.cargando()
  );

  ngOnInit(): void {
    this.companiaService.listarDisponibles().subscribe(data => this.companias.set(data));
    this.plantillaService.listarDisponibles().subscribe(data => this.plantillas.set(data));
    this.cobradorService.listarDisponibles().subscribe(data => {
      this.cobradores.set(data);
      this.cobradoresSeleccionados.set(new Set(data.map(c => c.persCodigo)));
    });
  }

  private filtrar<T>(lista: T[], texto: (item: T) => string, valor: string | T): T[] {
    const consulta = (typeof valor === 'string' ? valor : texto(valor)).toLowerCase();

    return lista.filter(item => texto(item).toLowerCase().includes(consulta));
  }

  // "codigo - nombre": mas facil de ubicar para quienes se guian por el codigo.
  private textoCia = (cia: CompaniaDisponible): string => `${cia.ciasCodigo} - ${cia.ciasNombre}`;

  displayCia = (cia: CompaniaDisponible | string | null): string =>
    !cia ? '' : (typeof cia === 'string' ? cia : this.textoCia(cia));

  displayPlantilla = (plantilla: FormatoDisponible | string | null): string =>
    !plantilla ? '' : (typeof plantilla === 'string' ? plantilla : plantilla.formNombre);

  onCiaSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.ciaSeleccionada.set(event.option.value as CompaniaDisponible);
  }

  onPlantillaClienteSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.plantillaClienteSeleccionada.set(event.option.value as FormatoDisponible);
  }

  onPlantillaEjecutivoSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.plantillaEjecutivoSeleccionada.set(event.option.value as FormatoDisponible);
  }

  // Selecciona todo el texto al enfocar, para poder tipear directo sin borrar a mano.
  seleccionarTexto(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  limpiarCia(): void {
    this.ciaControl.setValue('');
    this.ciaSeleccionada.set(null);
  }

  limpiarPlantillaCliente(): void {
    this.plantillaClienteControl.setValue('');
    this.plantillaClienteSeleccionada.set(null);
  }

  limpiarPlantillaEjecutivo(): void {
    this.plantillaEjecutivoControl.setValue('');
    this.plantillaEjecutivoSeleccionada.set(null);
  }

  onArchivoSeleccionado(file: File): void {
    this.archivo.set(file);
  }

  onArchivoRemovido(): void {
    this.archivo.set(null);
  }

  onFiltroCobradorInput(event: Event): void {
    this.filtroCobrador.set((event.target as HTMLInputElement).value);
  }

  toggleCobrador(persCodigo: number, incluido: boolean): void {
    this.cobradoresSeleccionados.update(actual => {
      const nuevo = new Set(actual);

      if (incluido) {
        nuevo.add(persCodigo);
      } else {
        nuevo.delete(persCodigo);
      }

      return nuevo;
    });
  }

  marcarTodosCobradores(marcar: boolean): void {
    this.cobradoresSeleccionados.set(
      marcar ? new Set(this.cobradores().map(c => c.persCodigo)) : new Set()
    );
  }

  enviar(): void {
    if (!this.puedeEnviar()) {
      return;
    }

    this.cargando.set(true);

    const formData = new FormData();

    formData.append('archivo', this.archivo()!);
    formData.append('ciasCodigo', String(this.ciaSeleccionada()!.ciasCodigo));
    formData.append('formCodigoCliente', String(this.plantillaClienteSeleccionada()!.formCodigo));
    formData.append('formCodigoEjecutivo', String(this.plantillaEjecutivoSeleccionada()!.formCodigo));
    formData.append('copiaCobrador', String(this.copiaCobrador()));
    formData.append('copiaEjecutivo', String(this.copiaEjecutivo()));
    formData.append('excluirDescuentoPlanilla', String(this.excluirDescuentoPlanilla()));

    this.cobradoresSeleccionados().forEach(persCodigo =>
      formData.append('cobradoresIncluidos', String(persCodigo))
    );

    this.loteService.cargarPlanilla(formData)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(confirmacion => this.mostrarExito(confirmacion));
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

      // Se espera la respuesta (el backend marca VALIDANDO de forma sincrona) antes de navegar,
      // si no la lista puede mostrar el lote como CARGADO y el auto-refresh nunca lo corrige.
      this.loteService.validarLote(confirmacion.loteId).subscribe(() => {
        this.router.navigate(['/inicio/avisos-cobranza/listar-lotes']);
      });
    });
  }
}
