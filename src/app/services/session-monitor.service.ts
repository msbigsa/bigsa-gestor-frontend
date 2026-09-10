import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

import { SessionWarningDialogComponent } from '../pages/authentication/session-warning-dialog/session-warning-dialog.component';
import { environment } from 'src/environments/environment';
import { SESSION_ACTIONS, SessionDialogResult } from '../pages/authentication/session-dialog-result';

interface ISessionInfo {
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class SessionMonitorService {

  private timeoutId?: number;

  readonly refreshRequested = new Subject<void>();

  readonly logoutRequested = new Subject<void>();

  private readonly jwtHelper = new JwtHelperService();

  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);

  start(): void {

    this.stop();

    if (environment.AUTH_MODE === 'COOKIE') {
      // el JWT es HttpOnly -- no hay forma de decodificarlo aca, hay que preguntarle al backend
      this.http.get<ISessionInfo>(`${environment.HOST_LOGIN}/auth/session`)
        .subscribe({
          next: ({ expiresAt }) => this.scheduleWarning(expiresAt),
          error: () => {} // sin sesion valida no hay nada que programar
        });
      return;
    }

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    if (!token) {
      return;
    }

    const expiration = this.jwtHelper.getTokenExpirationDate(token);

    if (!expiration) {
      return;
    }

    this.scheduleWarning(expiration.getTime());
  }

  private scheduleWarning(expiresAt: number): void {

    const warningTime =
      expiresAt
      - Date.now()
      - (environment.TOKEN_WARNING_MINUTES * 60 * 1000);

    if (warningTime <= 0) {
      return;
    }

    this.timeoutId = window.setTimeout(() => {
      this.showWarning(expiresAt);
    }, warningTime);
  }

  private showWarning(expirationTime: number): void {

    const dialogRef = this.dialog.open<
      SessionWarningDialogComponent,
      { expirationTime: number },
      SessionDialogResult
    >(
      SessionWarningDialogComponent,
      {
        width: '450px',
        disableClose: true,
        data: {
          expirationTime
        }
      }
    );

    dialogRef.afterClosed().subscribe(result => {

      switch (result) {

        case SESSION_ACTIONS.REFRESH:
          this.refreshRequested.next();
          break;

        case SESSION_ACTIONS.EXPIRED:
          this.logoutRequested.next();
          break;
      }

    });
  }

  stop(): void {

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
