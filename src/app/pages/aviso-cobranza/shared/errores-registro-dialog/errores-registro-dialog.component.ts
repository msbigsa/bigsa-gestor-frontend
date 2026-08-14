import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';

export interface ErroresRegistroDialogData {
  nroFila: number;
  poliza: string;
  motivos: string[];
}

// Solo lectura: muestra los motivos ya separados de un registro con error o envio fallido.
@Component({
  selector: 'app-errores-registro-dialog',
  imports: [CommonModule, MaterialModule],
  templateUrl: './errores-registro-dialog.component.html',
  styleUrl: './errores-registro-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErroresRegistroDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ErroresRegistroDialogData,
    private dialogRef: MatDialogRef<ErroresRegistroDialogComponent>,
  ) { }

  cerrar(): void {
    this.dialogRef.close();
  }
}
