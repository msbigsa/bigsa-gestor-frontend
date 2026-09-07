import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { estadoLoteClase, estadoLoteLabel } from '../estados-emision-masiva.util';

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

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;

  readonly hijosSeleccionados = signal<Set<number>>(new Set());

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EliminarLoteDialogData,
    private dialogRef: MatDialogRef<EliminarLoteDialogEmisionComponent, number[] | undefined>,
  ) { }

  toggleHijo(loteId: number, incluido: boolean): void {
    this.hijosSeleccionados.update(actual => {
      const nuevo = new Set(actual);
      incluido ? nuevo.add(loteId) : nuevo.delete(loteId);
      return nuevo;
    });
  }

  // Un hijo ya EMITIDO no se puede eliminar bajo ninguna condicion (mismo guardrail del backend) --
  // se sigue mostrando en la lista para que quede claro por que no se puede tocar, pero no seleccionable.
  esEmitido(hijo: LoteEmisionResponse): boolean {
    return hijo.estadoLote === EstadoLoteEmision.EMITIDO;
  }

  marcarTodos(marcar: boolean): void {
    const seleccionables = this.data.hijos.filter(h => !this.esEmitido(h)).map(h => h.loteId);
    this.hijosSeleccionados.set(marcar ? new Set(seleccionables) : new Set());
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    this.dialogRef.close([...this.hijosSeleccionados()]);
  }
}
