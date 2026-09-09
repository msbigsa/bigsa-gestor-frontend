import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';

export interface ErroresRegistroDialogData {
  nroFila: number;
  poliza: string;
  motivos: string[];
}

// Solo lectura: muestra los motivos ya separados de un registro con error.
@Component({
  selector: 'app-errores-registro-dialog-emision',
  imports: [CommonModule, MaterialModule],
  templateUrl: './errores-registro-dialog.component.html',
  styleUrl: './errores-registro-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErroresRegistroDialogEmisionComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ErroresRegistroDialogData,
    private dialogRef: MatDialogRef<ErroresRegistroDialogEmisionComponent>,
  ) { }

  cerrar(): void {
    this.dialogRef.close();
  }
}
