import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { combineLatest, finalize, map, startWith } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';

import { VidaSaludLoteService } from 'src/app/services/vida-y-salud/vidaSaludLote.service';
import { VidaSaludCompaniaService } from 'src/app/services/vida-y-salud/vidaSaludCompania.service';
import { VidaSaludPlantillaService } from 'src/app/services/vida-y-salud/vidaSaludPlantilla.service';

import { CompaniaDisponible } from 'src/app/models/vida-y-salud/CompaniaDisponible';
import { FormatoDisponible } from 'src/app/models/vida-y-salud/FormatoDisponible';
import { LoteVidaSaludConfirmacion } from 'src/app/models/vida-y-salud/LoteVidaSaludConfirmacion';
import { AgrupacionCorreo } from 'src/app/models/vida-y-salud/AgrupacionCorreo';
import { agrupacionCorreoLabel } from '../shared/estados-vida-salud.util';
import { TourService } from 'src/app/shared/tour/tour.service';
import { buildCargarLoteTourSteps } from '../vida-y-salud-tour.steps';
import {
  VistaPreviaPlantillaDialogComponent,
  VistaPreviaPlantillaDialogData,
} from '../shared/vista-previa-plantilla-dialog/vista-previa-plantilla-dialog.component';

@Component({
  selector: 'app-cargar-lote-vida-salud',
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FileDropzoneComponent,
  ],
  templateUrl: './cargar-lote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargarLoteVidaSaludComponent {

  private readonly loteService = inject(VidaSaludLoteService);
  private readonly companiaService = inject(VidaSaludCompaniaService);
  private readonly plantillaService = inject(VidaSaludPlantillaService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly tourService = inject(TourService);

  readonly agrupaciones = Object.values(AgrupacionCorreo);

  readonly companias = toSignal(this.companiaService.listarDisponibles(), { initialValue: [] as CompaniaDisponible[] });
  readonly formatos = toSignal(this.plantillaService.listarDisponibles(), { initialValue: [] as FormatoDisponible[] });

  // Compania (ciasCodigo)
  readonly ciaControl = new FormControl<string | CompaniaDisponible>('', { nonNullable: true });
  readonly ciaSeleccionada = signal<CompaniaDisponible | null>(null);
  readonly ciasFiltradas = toSignal(
    combineLatest([
      toObservable(this.companias),
      this.ciaControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([companias, valor]) => this.filtrar(companias, this.textoCia, valor)),
    ),
    { initialValue: [] as CompaniaDisponible[] },
  );

  // El caso mas comun es que la carga incluya facturas y nominas.
  readonly incluyePdf = signal(true);
  readonly enviaCorreo = signal(false);
  readonly agrupacionCorreo = signal<AgrupacionCorreo | null>(null);

  // Plantilla de correo (codFormato)
  readonly formatoControl = new FormControl<string | FormatoDisponible>('', { nonNullable: true });
  readonly formatoSeleccionado = signal<FormatoDisponible | null>(null);
  readonly formatosFiltrados = toSignal(
    combineLatest([
      toObservable(this.formatos),
      this.formatoControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([formatos, valor]) => this.filtrar(formatos, f => f.formNombre, valor)),
    ),
    { initialValue: [] as FormatoDisponible[] },
  );

  readonly archivo = signal<File | null>(null);

  readonly cargando = signal(false);

  readonly puedeEnviar = computed(() => {
    if (this.archivo() === null || this.ciaSeleccionada() === null || this.cargando()) {
      return false;
    }

    if (!this.enviaCorreo()) {
      return true;
    }

    return this.agrupacionCorreo() !== null && this.formatoSeleccionado() !== null;
  });

  constructor() {
    // enviaCorreo requiere incluyePdf=true (regla de negocio del backend) -- si incluyePdf se
    // desmarca, enviaCorreo y todo lo que depende de el se limpia en cascada.
    effect(() => {
      const conPdf = this.incluyePdf();

      untracked(() => {
        if (!conPdf && this.enviaCorreo()) {
          this.onEnviaCorreoChange(false);
        }
      });
    });
  }

  private filtrar<T>(lista: T[], texto: (item: T) => string, valor: string | T): T[] {
    const consulta = (typeof valor === 'string' ? valor : texto(valor)).toLowerCase();

    return lista.filter(item => texto(item).toLowerCase().includes(consulta));
  }

  // "codigo - nombre": mas facil de ubicar para quienes se guian por el codigo (igual que aviso-cobranza).
  private textoCia = (cia: CompaniaDisponible): string => `${cia.ciasCodigo} - ${cia.ciasNombre}`;

  displayCia = (cia: CompaniaDisponible | string | null): string =>
    !cia ? '' : (typeof cia === 'string' ? cia : this.textoCia(cia));

  displayFormato = (formato: FormatoDisponible | string | null): string =>
    !formato ? '' : (typeof formato === 'string' ? formato : formato.formNombre);

  onCiaSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.ciaSeleccionada.set(event.option.value as CompaniaDisponible);
  }

  onFormatoSeleccionado(event: MatAutocompleteSelectedEvent): void {
    this.formatoSeleccionado.set(event.option.value as FormatoDisponible);
  }

  // Selecciona todo el texto al enfocar, para poder tipear directo sin borrar a mano.
  seleccionarTexto(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  limpiarCia(): void {
    this.ciaControl.setValue('');
    this.ciaSeleccionada.set(null);
  }

  limpiarFormato(): void {
    this.formatoControl.setValue('');
    this.formatoSeleccionado.set(null);
  }

  onIncluyePdfChange(marcado: boolean): void {
    this.incluyePdf.set(marcado);
  }

  onEnviaCorreoChange(marcado: boolean): void {
    this.enviaCorreo.set(marcado);

    if (!marcado) {
      this.agrupacionCorreo.set(null);
      this.limpiarFormato();
    }
  }

  onArchivoSeleccionado(file: File): void {
    this.archivo.set(file);
  }

  onArchivoRemovido(): void {
    this.archivo.set(null);
  }

  iniciarTour(): void {
    this.tourService.start(buildCargarLoteTourSteps(this.enviaCorreo()));
  }

  readonly agrupacionLabel = agrupacionCorreoLabel;

  // Replica el flujo del legacy: si envia correo, antes de cargar se muestra un popup obligatorio con
  // la plantilla que se va a usar -- solo si el usuario confirma "Continuar" se sube el archivo.
  enviar(): void {
    if (!this.puedeEnviar()) {
      return;
    }

    if (this.enviaCorreo()) {
      this.abrirVistaPreviaPlantilla();
      return;
    }

    this.realizarCarga();
  }

  private abrirVistaPreviaPlantilla(): void {
    const dialogRef = this.dialog.open(VistaPreviaPlantillaDialogComponent, {
      width: '640px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        formCodigo: this.formatoSeleccionado()!.formCodigo,
        modoConfirmacion: true,
      } satisfies VistaPreviaPlantillaDialogData,
    });

    dialogRef.afterClosed().subscribe(continuar => {
      if (continuar) {
        this.realizarCarga();
      }
    });
  }

  private realizarCarga(): void {
    this.cargando.set(true);

    const formData = new FormData();

    formData.append('archivo', this.archivo()!);
    formData.append('ciasCodigo', String(this.ciaSeleccionada()!.ciasCodigo));
    formData.append('incluyePdf', String(this.incluyePdf()));
    formData.append('enviaCorreo', String(this.enviaCorreo()));

    if (this.enviaCorreo()) {
      formData.append('agrupacionCorreo', this.agrupacionCorreo()!);
      formData.append('codFormato', String(this.formatoSeleccionado()!.formCodigo));
    }

    this.loteService.cargarLote(formData)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(confirmacion => this.mostrarExito(confirmacion));
  }

  private mostrarExito(confirmacion: LoteVidaSaludConfirmacion): void {
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
        this.router.navigate(['/inicio/vida-y-salud/listar-lotes']);
      });
    });
  }
}
