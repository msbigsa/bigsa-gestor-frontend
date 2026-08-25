import {
  HttpClient,
  HttpContext,
  HttpHeaders
} from '@angular/common/http';

import {
  DestroyRef,
  inject,
  Injectable,
  signal
} from '@angular/core';

import { Router } from '@angular/router';

import {
  Observable,
  tap
} from 'rxjs';

import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from '../interceptors/loading.token';
import { Usuario } from '../models/Usuario';
import { LoginResponse } from '../models/LoginResponse';
import { SessionMonitorService } from './session-monitor.service';
import { NotificacionService } from './notifica/notificacion.service';
import { TabLockService } from './tab-lock.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ILoginRequest {
  username: string;
  password: string;
}

interface IRefreshRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  private readonly url = `${environment.HOST_LOGIN}/auth`;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionMonitor = inject(SessionMonitorService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly tabLock = inject(TabLockService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<Usuario | null>(null);

  constructor() {

    // Cubre el caso "recargar la pagina con una sesion ya valida" -- guardarSesion() no se
    // vuelve a llamar en un refresh porque el token ya esta en sessionStorage.
    if (this.isLogged()) {
      this.tabLock.acquire();
    }

    this.sessionMonitor.refreshRequested
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshToken()
          .subscribe({

            next: (response) => {

              this.guardarSesion(
                response as LoginResponse
              );

              this.sessionMonitor.start();
              this.notificacionService.start();
            },

            error: () => {
              this.logout();
            }
          });
      });

    this.sessionMonitor.logoutRequested
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.logout();
      });
  }

  cargarPerfil(): Observable<Usuario> {

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    return this.http.get<Usuario>(`${environment.HOST_LOGIN}/profile`,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    ).pipe(
      tap(usuario => this.profile.set(usuario))
    );
  }

  actualizarFotoPerfil(archivo: File): Observable<Usuario> {

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<Usuario>(`${environment.HOST_LOGIN}/profile/foto`, formData,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    ).pipe(
      tap(usuario => this.profile.set(usuario))
    );
  }

  eliminarFotoPerfil(): Observable<Usuario> {

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    return this.http.delete<Usuario>(`${environment.HOST_LOGIN}/profile/foto`,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    ).pipe(
      tap(usuario => this.profile.set(usuario))
    );
  }

  login(username: string, password: string): Observable<LoginResponse> {

    const body: ILoginRequest = { username, password };

    return this.http.post<LoginResponse>(
      `${this.url}/login`,
      body,
      {
        context: new HttpContext()
          .set(SKIP_GLOBAL_LOADING, true)
      }
    );
  }

  logout(): void {

    this.sessionMonitor.stop();
    this.notificacionService.stop();
    this.tabLock.release();

    sessionStorage.clear();

    this.router.navigate(['authentication/login']);
  }

  isLogged(): boolean {

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    return token != null;
  }

  sendMail(username: string) {

    return this.http.post(`${environment.HOST_LOGIN}/mail/sendMail`, username,
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/plain')
      }
    );
  }

  checkTokenReset(random: string) {

    return this.http.get(`${environment.HOST_LOGIN}/mail/reset/check/${random}`);
  }

  reset(random: string, newPassword: string) {

    return this.http.post(`${environment.HOST_LOGIN}/mail/reset/${random}`, newPassword,
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/plain')
      }
    );
  }

  refreshToken(): Observable<LoginResponse> {

    const refreshToken = sessionStorage.getItem(environment.REFRESH_TOKEN_NAME);

    if (!refreshToken) {
      throw new Error('No existe refresh token');
    }

    const body: IRefreshRequest = { refreshToken };

    return this.http.post<LoginResponse>(`${this.url}/refresh`, body);
  }

  guardarSesion(response: LoginResponse): void {

    sessionStorage.setItem(environment.TOKEN_NAME, response.jwtToken);

    sessionStorage.setItem(environment.REFRESH_TOKEN_NAME, response.refreshToken);

    this.tabLock.acquire();
  }
}
