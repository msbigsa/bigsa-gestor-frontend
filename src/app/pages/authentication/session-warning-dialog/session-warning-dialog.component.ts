import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { TablerIconComponent } from 'angular-tabler-icons';
import { environment } from 'src/environments/environment';
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

  readonly initialSeconds = environment.TOKEN_WARNING_MINUTES * 60;

  readonly secondsRemaining = signal(this.initialSeconds);

  readonly SESSION_ACTIONS = SESSION_ACTIONS;

  constructor(
    private readonly dialogRef: MatDialogRef<SessionWarningDialogComponent, SessionDialogResult>    
  ) { }

  ngOnInit(): void {

    interval(1000)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        const remaining = this.secondsRemaining() - 1;

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

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get progress(): number {

    return (this.secondsRemaining() / this.initialSeconds) * 100;
  }

}
