import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

import { SessionWarningDialogComponent } from '../pages/authentication/session-warning-dialog/session-warning-dialog.component';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SessionMonitorService {

  private timeoutId?: number;

  readonly refreshRequested = new Subject<void>();

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
      - (10 * 60 * 1000);

    if (warningTime <= 0) {
      return;
    }

    this.timeoutId = window.setTimeout(() => {
      this.showWarning();
    }, warningTime);
  }

  private showWarning(): void {

    const dialogRef = this.dialog.open(
      SessionWarningDialogComponent,
      {
        width: '450px',
        disableClose: true
      }
    );

    dialogRef.afterClosed()
      .subscribe(continuar => {

        if (!continuar) {
          return;
        }

        this.refreshRequested.next();
      });
  }

  stop(): void {

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
