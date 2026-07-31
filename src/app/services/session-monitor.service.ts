import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

import { SessionWarningDialogComponent } from '../pages/authentication/session-warning-dialog/session-warning-dialog.component';
import { environment } from 'src/environments/environment';
import { SESSION_ACTIONS, SessionDialogResult } from '../pages/authentication/session-dialog-result';

@Injectable({
  providedIn: 'root',
})
export class SessionMonitorService {

  private timeoutId?: number;

  readonly refreshRequested = new Subject<void>();

  readonly logoutRequested = new Subject<void>();

  private readonly jwtHelper = new JwtHelperService();

  private readonly dialog = inject(MatDialog);

  start(): void {

    this.stop();

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    if (!token) {
      return;
    }

    const expiration = this.jwtHelper.getTokenExpirationDate(token);

    if (!expiration) {
      return;
    }

    const warningTime =
      expiration.getTime()
      - Date.now()
      - (environment.TOKEN_WARNING_MINUTES * 60 * 1000);

    /*console.log(`Ahora: ${Date.now()}`);
    console.log(`Expira: ${expiration?.getTime()}`);
    console.log('TOKEN_WARNING_MINUTES:', environment.TOKEN_WARNING_MINUTES);
    console.log(`warningTime: ${warningTime}`);*/

    if (warningTime <= 0) {
      return;
    }

    this.timeoutId = window.setTimeout(() => {
      this.showWarning();
    }, warningTime);
  }

  private showWarning(): void {

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    if (!token) {
      return;
    }

    const expiration = this.jwtHelper.getTokenExpirationDate(token);

    if (!expiration) {
      return;
    }

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
          expirationTime: expiration.getTime()
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
