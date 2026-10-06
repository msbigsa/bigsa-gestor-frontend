import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteVidaSaludResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludResponse';
import { EstadoLoteVidaSalud } from 'src/app/models/vida-y-salud/EstadoLoteVidaSalud';
import { estadoLoteClase, estadoLoteLabel, tieneFilasFacturadas, AVISO_ELIMINAR_FILAS_FACTURADAS } from '../estados-vida-salud.util';

export interface EliminarLoteDialogData {
  lote: LoteVidaSaludResponse;
  hijos: LoteVidaSaludResponse[];
}

// Deja elegir que hijos cascadear; no ejecuta el DELETE, eso lo hace el caller.
@Component({
  selector: 'app-eliminar-lote-dialog-vida-salud',
  imports: [CommonModule, MaterialModule],
  templateUrl: './eliminar-lote-dialog.component.html',
  styleUrl: './eliminar-lote-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarLoteDialogVidaSaludComponent {

  // Coincide con EstadoLoteVidaSalud.INTERMEDIOS -- unico caso que eliminarLote rechaza.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteVidaSalud[] =
    [EstadoLoteVidaSalud.VALIDANDO, EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS, EstadoLoteVidaSalud.FACTURANDO];

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly avisoFilasFacturadas = AVISO_ELIMINAR_FILAS_FACTURADAS;

  readonly hijosSeleccionados = signal<Set<number>>(new Set());

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EliminarLoteDialogData,
    private dialogRef: MatDialogRef<EliminarLoteDialogVidaSaludComponent, number[] | undefined>,
  ) { }

  hayFilasFacturadas(): boolean {
    return tieneFilasFacturadas(this.data.lote) || this.data.hijos.some(tieneFilasFacturadas);
  }

  toggleHijo(loteId: number, incluido: boolean): void {
    this.hijosSeleccionados.update(actual => {
      const nuevo = new Set(actual);
      incluido ? nuevo.add(loteId) : nuevo.delete(loteId);
      return nuevo;
    });
  }

  // Se muestra igual en la lista, solo queda no seleccionable.
  enProceso(hijo: LoteVidaSaludResponse): boolean {
    return EliminarLoteDialogVidaSaludComponent.ESTADOS_EN_PROCESO.includes(hijo.estadoLote);
  }

  marcarTodos(marcar: boolean): void {
    const seleccionables = this.data.hijos.filter(h => !this.enProceso(h)).map(h => h.loteId);
    this.hijosSeleccionados.set(marcar ? new Set(seleccionables) : new Set());
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    this.dialogRef.close([...this.hijosSeleccionados()]);
  }
}
