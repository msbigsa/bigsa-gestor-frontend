import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { LoteVidaSaludResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludResponse';
import { EstadoLoteVidaSalud } from 'src/app/models/vida-y-salud/EstadoLoteVidaSalud';
import { estadoLoteLabel } from 'src/app/pages/vida-y-salud/shared/estados-vida-salud.util';

export interface ForzarEstadoDialogData {
  lote: LoteVidaSaludResponse;
}

// Deja elegir el nuevo estado; no ejecuta el PUT, eso lo hace el caller.
@Component({
  selector: 'app-forzar-estado-dialog-vida-salud',
  imports: [CommonModule, MaterialModule],
  templateUrl: './forzar-estado-dialog.component.html',
  styleUrl: './forzar-estado-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForzarEstadoDialogVidaSaludComponent {

  readonly estadosDisponibles = Object.values(EstadoLoteVidaSalud);
  readonly estadoLabel = estadoLoteLabel;

  readonly estadoSeleccionado = signal<EstadoLoteVidaSalud | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ForzarEstadoDialogData,
    private dialogRef: MatDialogRef<ForzarEstadoDialogVidaSaludComponent, EstadoLoteVidaSalud | undefined>,
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
