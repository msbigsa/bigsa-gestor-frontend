import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { EstadoLoteCarga } from 'src/app/models/carga-masiva-generica/EstadoLoteCarga';
import { estadoLoteLabel } from 'src/app/pages/carga-masiva-generica/shared/estados-carga-masiva.util';

export interface ForzarEstadoDialogData {
  lote: LoteCargaResponse;
}

// Deja elegir el nuevo estado; no ejecuta el PUT, eso lo hace el caller.
@Component({
  selector: 'app-forzar-estado-dialog-carga-masiva',
  imports: [CommonModule, MaterialModule],
  templateUrl: './forzar-estado-dialog.component.html',
  styleUrl: './forzar-estado-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForzarEstadoDialogCargaMasivaComponent {

  readonly estadosDisponibles = Object.values(EstadoLoteCarga);
  readonly estadoLabel = estadoLoteLabel;

  readonly estadoSeleccionado = signal<EstadoLoteCarga | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ForzarEstadoDialogData,
    private dialogRef: MatDialogRef<ForzarEstadoDialogCargaMasivaComponent, EstadoLoteCarga | undefined>,
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
