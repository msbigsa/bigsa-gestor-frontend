import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ConfirmDialogResult } from './confirm-dialog-result.enum';

export interface ConfirmDialogData {
  title: string;
  message: string;

  cancelText?: string;
  confirmText?: string;
  confirmTextAdic?: string;

  type?: 'danger' | 'warning' | 'info' | 'success' | 'help';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent, ConfirmDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  get icon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'delete';

      case 'warning':
        return 'warning';

      case 'success':
        return 'check_circle_outline';

      case 'info':
        return 'info_outline';

      case 'help':
      default:
        return 'help_outline';          
    }
  }

  get iconColor(): 'primary' | 'warn' {
    switch (this.data.type) {
      case 'danger':
      case 'warning':
        return 'warn';

      default:
        return 'primary';
    }
  }

  get buttonColor(): 'primary' | 'warn' {
    return this.data.type === 'danger'
      ? 'warn'
      : 'primary';
  }

  confirmarAdicional(): void {
    this.dialogRef.close(
      ConfirmDialogResult.CONFIRM_ADDITIONAL
    );
  }

  confirmar(): void {
    this.dialogRef.close(
      ConfirmDialogResult.CONFIRM
    );
  }

  cancelar(): void {
    this.dialogRef.close(
      ConfirmDialogResult.CANCEL
    );
  }
}