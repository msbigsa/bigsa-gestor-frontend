import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { estadoLoteLabel } from 'src/app/pages/emision-masiva/shared/estados-emision-masiva.util';

export interface ForzarEstadoDialogData {
  lote: LoteEmisionResponse;
}

// Deja elegir el nuevo estado; no ejecuta el PUT, eso lo hace el caller.
@Component({
  selector: 'app-forzar-estado-dialog-emision',
  imports: [CommonModule, MaterialModule],
  templateUrl: './forzar-estado-dialog.component.html',
  styleUrl: './forzar-estado-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForzarEstadoDialogEmisionComponent {

  readonly estadosDisponibles = Object.values(EstadoLoteEmision);
  readonly estadoLabel = estadoLoteLabel;

  readonly estadoSeleccionado = signal<EstadoLoteEmision | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ForzarEstadoDialogData,
    private dialogRef: MatDialogRef<ForzarEstadoDialogEmisionComponent, EstadoLoteEmision | undefined>,
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
