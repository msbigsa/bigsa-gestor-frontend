import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { TablerIconComponent } from 'angular-tabler-icons';

import { SESSION_ACTIONS } from '../session-dialog-result';
import type { SessionDialogResult } from '../session-dialog-result';

@Component({
  selector: 'app-session-warning-dialog',
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconComponent
  ],
  templateUrl: './session-warning-dialog.component.html',
  styleUrl: './session-warning-dialog.component.scss',
})
export class SessionWarningDialogComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);

  readonly data = inject(MAT_DIALOG_DATA) as {
    expirationTime: number;
  };

  readonly secondsRemaining = signal(0);

  readonly initialSeconds = signal(0);

  readonly SESSION_ACTIONS = SESSION_ACTIONS;

  constructor(
    private readonly dialogRef: MatDialogRef<
      SessionWarningDialogComponent,
      SessionDialogResult
    >
  ) { }

  ngOnInit(): void {

    const initial = Math.max(
      0,
      Math.floor(
        (this.data.expirationTime - Date.now()) / 1000
      )
    );

    this.initialSeconds.set(initial);
    this.secondsRemaining.set(initial);

    interval(1000)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        const remaining = Math.max(
          0,
          Math.floor(
            (this.data.expirationTime - Date.now()) / 1000
          )
        );

        this.secondsRemaining.set(remaining);

        if (remaining <= 0) {
          this.dialogRef.close(SESSION_ACTIONS.EXPIRED);
        }
      });
  }

  get formattedTime(): string {

    const totalSeconds = this.secondsRemaining();

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  get progress(): number {

    const initial = this.initialSeconds();

    if (!initial) {
      return 0;
    }

    return (this.secondsRemaining() / initial) * 100;
  }

}