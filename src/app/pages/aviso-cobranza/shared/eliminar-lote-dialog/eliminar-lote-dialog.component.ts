import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from 'src/app/material.module';
import { LoteCargaResponse } from 'src/app/models/aviso-cobranza/LoteCargaResponse';
import { estadoLoteClase, estadoLoteLabel } from '../estados-aviso-cobranza.util';

export interface EliminarLoteDialogData {
  lote: LoteCargaResponse;
  hijos: LoteCargaResponse[];
}

// Deja elegir que hijos cascadear; no ejecuta el DELETE, eso lo hace el caller.
@Component({
  selector: 'app-eliminar-lote-dialog',
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  templateUrl: './eliminar-lote-dialog.component.html',
  styleUrl: './eliminar-lote-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarLoteDialogComponent {

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;

  readonly hijosSeleccionados = signal<Set<number>>(new Set());

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EliminarLoteDialogData,
    private dialogRef: MatDialogRef<EliminarLoteDialogComponent, number[] | undefined>,
  ) { }

  toggleHijo(loteId: number, incluido: boolean): void {
    this.hijosSeleccionados.update(actual => {
      const nuevo = new Set(actual);
      incluido ? nuevo.add(loteId) : nuevo.delete(loteId);
      return nuevo;
    });
  }

  marcarTodos(marcar: boolean): void {
    this.hijosSeleccionados.set(
      marcar ? new Set(this.data.hijos.map(h => h.loteId)) : new Set()
    );
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    this.dialogRef.close([...this.hijosSeleccionados()]);
  }
}
