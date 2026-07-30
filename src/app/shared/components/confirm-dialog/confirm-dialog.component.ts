import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogResult } from './confirm-dialog-result.enum';


export interface ConfirmDialogData {
  title: string;
  message: string;  
  cancelText: string;
  confirmText: string;

  confirmTextAdic?: string;
  useConfirmTextAdic?: boolean;
}


@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent,ConfirmDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  confirmarAdicional(): void {
  this.dialogRef.close(ConfirmDialogResult.CONFIRM_ADDITIONAL);
}

confirmar(): void {
  this.dialogRef.close(ConfirmDialogResult.CONFIRM);
}

cancelar(): void {
  this.dialogRef.close(ConfirmDialogResult.CANCEL);
}
}