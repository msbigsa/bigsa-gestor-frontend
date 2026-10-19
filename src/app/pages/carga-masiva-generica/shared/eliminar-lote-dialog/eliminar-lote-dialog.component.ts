import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { ESTADOS_EN_PROCESO, estadoLoteClase, estadoLoteLabel } from '../estados-carga-masiva.util';

export interface EliminarLoteDialogData {
  lote: LoteCargaResponse;
  hijos: LoteCargaResponse[];
}

// Deja elegir que hijos cascadear; no ejecuta el DELETE, eso lo hace el caller.
@Component({
  selector: 'app-eliminar-lote-dialog-carga-masiva',
  imports: [CommonModule, MaterialModule],
  templateUrl: './eliminar-lote-dialog.component.html',
  styleUrl: './eliminar-lote-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarLoteDialogCargaMasivaComponent {

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;

  readonly hijosSeleccionados = signal<Set<number>>(new Set());

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EliminarLoteDialogData,
    private dialogRef: MatDialogRef<EliminarLoteDialogCargaMasivaComponent, number[] | undefined>,
  ) { }

  toggleHijo(loteId: number, incluido: boolean): void {
    this.hijosSeleccionados.update(actual => {
      const nuevo = new Set(actual);
      incluido ? nuevo.add(loteId) : nuevo.delete(loteId);
      return nuevo;
    });
  }

  // Se muestra igual en la lista, solo queda no seleccionable.
  enProceso(hijo: LoteCargaResponse): boolean {
    return ESTADOS_EN_PROCESO.includes(hijo.estadoLote);
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
