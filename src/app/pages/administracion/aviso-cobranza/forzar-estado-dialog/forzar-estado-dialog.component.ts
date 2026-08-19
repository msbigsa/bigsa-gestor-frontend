import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteCargaResponse } from 'src/app/models/aviso-cobranza/LoteCargaResponse';
import { EstadoLote } from 'src/app/models/aviso-cobranza/EstadoLote';
import { estadoLoteLabel } from 'src/app/pages/aviso-cobranza/shared/estados-aviso-cobranza.util';

export interface ForzarEstadoDialogData {
  lote: LoteCargaResponse;
}

// Deja elegir el nuevo estado; no ejecuta el PUT, eso lo hace el caller.
@Component({
  selector: 'app-forzar-estado-dialog',
  imports: [CommonModule, MaterialModule],
  templateUrl: './forzar-estado-dialog.component.html',
  styleUrl: './forzar-estado-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForzarEstadoDialogComponent {

  readonly estadosDisponibles = Object.values(EstadoLote);
  readonly estadoLabel = estadoLoteLabel;

  readonly estadoSeleccionado = signal<EstadoLote | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ForzarEstadoDialogData,
    private dialogRef: MatDialogRef<ForzarEstadoDialogComponent, EstadoLote | undefined>,
  ) { }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    const estado = this.estadoSeleccionado();
    if (estado) {
      this.dialogRef.close(estado);
    }
  }
}
