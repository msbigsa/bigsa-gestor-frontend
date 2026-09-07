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

import { EmisionMasivaLoteService } from 'src/app/services/emision-masiva/emisionMasivaLote.service';
import { EmisionMasivaFormatoService } from 'src/app/services/emision-masiva/emisionMasivaFormato.service';

import { FormatoDisponible } from 'src/app/models/emision-masiva/FormatoDisponible';
import { LoteEmisionConfirmacion } from 'src/app/models/emision-masiva/LoteEmisionConfirmacion';
import { OpcionBusqueda } from 'src/app/models/emision-masiva/OpcionBusqueda';
import { CodDestinatario } from 'src/app/models/emision-masiva/CodDestinatario';
import { CodLlaveBusqueda } from 'src/app/models/emision-masiva/CodLlaveBusqueda';
import {
  codDestinatarioLabel,
  codLlaveBusquedaLabel,
  llavesBusquedaDisponibles,
  opcionBusquedaLabel,
} from '../shared/estados-emision-masiva.util';

@Component({
  selector: 'app-cargar-lote-emision',
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FileDropzoneComponent,
  ],
  templateUrl: './cargar-lote.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargarLoteEmisionComponent {

  private readonly loteService = inject(EmisionMasivaLoteService);
  private readonly formatoService = inject(EmisionMasivaFormatoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly opcionesBusqueda = Object.values(OpcionBusqueda);
  readonly destinatarios = Object.values(CodDestinatario);

  readonly formatos = toSignal(this.formatoService.listarDisponibles(), { initialValue: [] as FormatoDisponible[] });

  readonly opcionBusqueda = signal<OpcionBusqueda | null>(null);
  readonly enviaCorreo = signal(false);
  readonly codDestinatario = signal<CodDestinatario | null>(null);
  readonly codLlaveBusqueda = signal<CodLlaveBusqueda | null>(null);

  readonly llavesDisponibles = computed(() => llavesBusquedaDisponibles(this.codDestinatario()));

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
    if (this.archivo() === null || this.opcionBusqueda() === null || this.cargando()) {
      return false;
    }

    if (!this.enviaCorreo()) {
      return true;
    }

    return this.codDestinatario() !== null
      && this.codLlaveBusqueda() !== null
      && this.formatoSeleccionado() !== null;
  });

  constructor() {
    // Si el destinatario cambia y la llave elegida deja de tener sentido (ej. RUT_ASEGURADO sin
    // asegurado como destinatario), se limpia en vez de dejar una combinacion invalida silenciosa.
    effect(() => {
      const disponibles = this.llavesDisponibles();

      untracked(() => {
        const actual = this.codLlaveBusqueda();
        if (actual !== null && !disponibles.includes(actual)) {
          this.codLlaveBusqueda.set(null);
        }
      });
    });
  }

  private filtrar<T>(lista: T[], texto: (item: T) => string, valor: string | T): T[] {
    const consulta = (typeof valor === 'string' ? valor : texto(valor)).toLowerCase();

    return lista.filter(item => texto(item).toLowerCase().includes(consulta));
  }

  displayFormato = (formato: FormatoDisponible | string | null): string =>
    !formato ? '' : (typeof formato === 'string' ? formato : formato.formNombre);

  onFormatoSeleccionado(event: MatAutocompleteSelectedEvent): void {
    this.formatoSeleccionado.set(event.option.value as FormatoDisponible);
  }

  // Selecciona todo el texto al enfocar, para poder tipear directo sin borrar a mano.
  seleccionarTexto(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  limpiarFormato(): void {
    this.formatoControl.setValue('');
    this.formatoSeleccionado.set(null);
  }

  onEnviaCorreoChange(marcado: boolean): void {
    this.enviaCorreo.set(marcado);

    if (!marcado) {
      this.codDestinatario.set(null);
      this.codLlaveBusqueda.set(null);
      this.limpiarFormato();
    }
  }

  onArchivoSeleccionado(file: File): void {
    this.archivo.set(file);
  }

  onArchivoRemovido(): void {
    this.archivo.set(null);
  }

  readonly opcionLabel = opcionBusquedaLabel;
  readonly destinatarioLabel = codDestinatarioLabel;
  readonly llaveLabel = codLlaveBusquedaLabel;

  enviar(): void {
    if (!this.puedeEnviar()) {
      return;
    }

    this.cargando.set(true);

    const formData = new FormData();

    formData.append('archivo', this.archivo()!);
    formData.append('opcionBusqueda', this.opcionBusqueda()!);
    formData.append('enviaCorreo', String(this.enviaCorreo()));

    if (this.enviaCorreo()) {
      formData.append('codDestinatario', this.codDestinatario()!);
      formData.append('codLlaveBusqueda', this.codLlaveBusqueda()!);
      formData.append('codFormato', String(this.formatoSeleccionado()!.formCodigo));
    }

    this.loteService.cargarLote(formData)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(confirmacion => this.mostrarExito(confirmacion));
  }

  private mostrarExito(confirmacion: LoteEmisionConfirmacion): void {
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
        this.router.navigate(['/inicio/emision-masiva/listar-lotes']);
      });
    });
  }
}
