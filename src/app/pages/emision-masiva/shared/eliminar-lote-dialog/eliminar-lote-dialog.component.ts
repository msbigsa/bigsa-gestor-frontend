import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { estadoLoteClase, estadoLoteLabel, tieneFilasEmitidas, AVISO_ELIMINAR_FILAS_EMITIDAS } from '../estados-emision-masiva.util';

export interface EliminarLoteDialogData {
  lote: LoteEmisionResponse;
  hijos: LoteEmisionResponse[];
}

// Deja elegir que hijos cascadear; no ejecuta el DELETE, eso lo hace el caller.
@Component({
  selector: 'app-eliminar-lote-dialog-emision',
  imports: [CommonModule, MaterialModule],
  templateUrl: './eliminar-lote-dialog.component.html',
  styleUrl: './eliminar-lote-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarLoteDialogEmisionComponent {

  // Coincide con EstadoLoteEmision.INTERMEDIOS -- unico caso que eliminarLote rechaza.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteEmision[] =
    [EstadoLoteEmision.VALIDANDO, EstadoLoteEmision.PROCESANDO_DOCUMENTOS, EstadoLoteEmision.EMITIENDO];

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly avisoFilasEmitidas = AVISO_ELIMINAR_FILAS_EMITIDAS;

  readonly hijosSeleccionados = signal<Set<number>>(new Set());

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EliminarLoteDialogData,
    private dialogRef: MatDialogRef<EliminarLoteDialogEmisionComponent, number[] | undefined>,
  ) { }

  hayFilasEmitidas(): boolean {
    return tieneFilasEmitidas(this.data.lote) || this.data.hijos.some(tieneFilasEmitidas);
  }

  toggleHijo(loteId: number, incluido: boolean): void {
    this.hijosSeleccionados.update(actual => {
      const nuevo = new Set(actual);
      incluido ? nuevo.add(loteId) : nuevo.delete(loteId);
      return nuevo;
    });
  }

  // Se muestra igual en la lista, solo queda no seleccionable.
  enProceso(hijo: LoteEmisionResponse): boolean {
    return EliminarLoteDialogEmisionComponent.ESTADOS_EN_PROCESO.includes(hijo.estadoLote);
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
