import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { VidaSaludCmasPdfService } from 'src/app/services/vida-y-salud/vidaSaludCmasPdf.service';
import { CmasPdf } from 'src/app/models/vida-y-salud/CmasPdf';
import { CompaniaDisponible } from 'src/app/models/vida-y-salud/CompaniaDisponible';

export interface EditarCompaniaDialogData {
  // Presente solo al editar una fila existente.
  configuracion?: CmasPdf;
  // Nombre resuelto del catálogo para la compañía que se está editando -- se pasa ya resuelto desde
  // el listado (que ya tiene el catálogo completo cargado) en vez de volver a pedirlo aquí.
  nombreCompania?: string;
  // Presente solo al crear -- compañías del catálogo que todavía no tienen fila en CMAS_PDF.
  companiasDisponibles?: CompaniaDisponible[];
}

// Un solo dialogo para crear y editar: en modo creacion la compañia se elige por autocomplete
// (solo entre las que aun no tienen configuracion); en modo edicion queda fija (es la PK del recurso).
@Component({
  selector: 'app-editar-compania-dialog',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './editar-compania-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarCompaniaDialogComponent {

  private readonly cmasPdfService = inject(VidaSaludCmasPdfService);
  private readonly dialogRef = inject(MatDialogRef<EditarCompaniaDialogComponent, CmasPdf | undefined>);

  readonly esEdicion = !!this.data.configuracion;
  readonly guardando = signal(false);

  // "codigo - nombre", igual que en el resto de la app; si por algun motivo no se resolvio el
  // nombre, se muestra solo el codigo en vez de dejar un "undefined" colgando.
  readonly textoCia = this.esEdicion
    ? (this.data.nombreCompania
        ? `${this.data.configuracion!.ciasCodigo} - ${this.data.nombreCompania}`
        : `${this.data.configuracion!.ciasCodigo}`)
    : '';

  // Compañía (solo en modo creacion)
  readonly companiasDisponibles = this.data.companiasDisponibles ?? [];
  readonly ciaControl = new FormControl<string | CompaniaDisponible>('', { nonNullable: true });
  readonly ciaSeleccionada = signal<CompaniaDisponible | null>(null);
  readonly ciasFiltradas = toSignal(
    this.ciaControl.valueChanges.pipe(
      startWith(''),
      map(valor => this.filtrar(this.companiasDisponibles, c => c.ciasNombre, valor)),
    ),
    { initialValue: this.companiasDisponibles },
  );

  // Solo puede ser "S" o "N" en el backend -- se maneja como checkbox, no como texto libre.
  readonly ciaRepitePoliza = signal(false);

  readonly form = new FormGroup({
    posFactura: new FormControl<number | null>(null),
    larFactura: new FormControl<number | null>(null),
    posFacturaNom: new FormControl<number | null>(null),
    larFacturaNom: new FormControl<number | null>(null),
    posPolizaNom: new FormControl<number | null>(null),
    larPolizaNom: new FormControl<number | null>(null),
    tipoRut: new FormControl<number | null>(null),
    tipoMatch: new FormControl<'SUBSTRING' | 'EXACTO'>('SUBSTRING', { nonNullable: true }),
    prefijo: new FormControl(''),
    tipoNomina: new FormControl(''),
    aNombreDe: new FormControl(''),
    rut: new FormControl(''),
    banco: new FormControl(''),
    ctacte: new FormControl(''),
    fantasia: new FormControl(''),
    direccion: new FormControl(''),
    comuna: new FormControl(''),
    ciudad: new FormControl(''),
  });

  readonly puedeGuardar = computed(() => (this.esEdicion || this.ciaSeleccionada() !== null) && !this.guardando());

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditarCompaniaDialogData) {
    if (data.configuracion) {
      this.form.patchValue(data.configuracion);
      this.ciaRepitePoliza.set(data.configuracion.ciaRepitePoliza === 'S');
    }
  }

  private filtrar<T>(lista: T[], texto: (item: T) => string, valor: string | T): T[] {
    const consulta = (typeof valor === 'string' ? valor : texto(valor)).toLowerCase();
    return lista.filter(item => texto(item).toLowerCase().includes(consulta));
  }

  private sinNulos<T extends Record<string, unknown>>(valores: T): { [K in keyof T]: Exclude<T[K], null> | undefined } {
    const resultado = {} as { [K in keyof T]: Exclude<T[K], null> | undefined };
    for (const clave of Object.keys(valores) as (keyof T)[]) {
      const valor = valores[clave];
      resultado[clave] = (valor === null ? undefined : valor) as Exclude<T[typeof clave], null> | undefined;
    }
    return resultado;
  }

  displayCia = (cia: CompaniaDisponible | string | null): string =>
    !cia ? '' : (typeof cia === 'string' ? cia : cia.ciasNombre);

  onCiaSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.ciaSeleccionada.set(event.option.value as CompaniaDisponible);
  }

  seleccionarTexto(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  guardar(): void {
    if (!this.puedeGuardar()) {
      return;
    }

    this.guardando.set(true);

    // Reactive Forms usa null como "vacio" en todos los campos -- CmasPdf los declara opcionales
    // (undefined), no null, asi que se convierte de forma generica antes de armar el payload.
    const valores = this.sinNulos(this.form.getRawValue());
    const cmasPdf: CmasPdf = {
      ciasCodigo: this.esEdicion ? this.data.configuracion!.ciasCodigo : this.ciaSeleccionada()!.ciasCodigo,
      ciaRepitePoliza: this.ciaRepitePoliza() ? 'S' : 'N',
      ...valores,
    };

    const request$ = this.esEdicion
      ? this.cmasPdfService.actualizar(cmasPdf.ciasCodigo, cmasPdf)
      : this.cmasPdfService.crear(cmasPdf);

    request$.subscribe({
      next: guardado => this.dialogRef.close(guardado),
      error: () => this.guardando.set(false),
    });
  }
}
