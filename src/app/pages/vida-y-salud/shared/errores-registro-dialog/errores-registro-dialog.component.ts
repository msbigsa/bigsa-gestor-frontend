import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';

export interface ErroresRegistroDialogData {
  nroFila: number;
  factura: string;
  motivos: string[];
}

// Solo lectura: muestra los motivos ya separados de un registro con error.
@Component({
  selector: 'app-errores-registro-dialog-vida-salud',
  imports: [CommonModule, MaterialModule],
  templateUrl: './errores-registro-dialog.component.html',
  styleUrl: './errores-registro-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErroresRegistroDialogVidaSaludComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ErroresRegistroDialogData,
    private dialogRef: MatDialogRef<ErroresRegistroDialogVidaSaludComponent>,
  ) { }

  cerrar(): void {
    this.dialogRef.close();
  }
}
