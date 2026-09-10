import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EventSourcePolyfill, EventSourcePolyfillInit } from 'event-source-polyfill';

import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { Notificacion } from '../../models/notifica/Notificacion';
import { ConfigsUsuario } from '../../models/ConfigsUsuario';
import { ConfigsService } from '../configs.service';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {

  private readonly url = `${environment.HOST_NOTIFICA}/notificaciones`;

  private readonly http = inject(HttpClient);
  private readonly configsService = inject(ConfigsService);

  private eventSource?: EventSourcePolyfill;

  // Config real (GESTOR_USA_NOTIFICACION en GLO_PARAMETRO, via ms-bigsa-auth) -- se carga
  // en cargarConfigs() antes de cada start(). El header lo usa para ocultar la campanita.
  readonly habilitado = signal(false);

  readonly notificaciones = signal<Notificacion[]>([]);

  readonly cantidadNoLeidas = computed(() => this.notificaciones().length);

  // Trae el valor actual de la config desde el backend -- llamar antes de start() para
  // que el gate use el dato vigente (puede haber sido cambiado desde el tab de Administracion).
  cargarConfigs(): Observable<ConfigsUsuario> {

    return this.configsService.obtenerConfigs().pipe(
      tap(configs => this.habilitado.set(configs.usaNotificacion))
    );
  }

  // Se llama al iniciar sesion y cada vez que se refresca el token (ver LoginService),
  // para que el stream siempre viaje con una credencial vigente (header o cookie segun el modo).
  start(): void {

    this.stop();

    if (!this.habilitado()) {
      return;
    }

    const options = this.buildEventSourceOptions();

    if (!options) {
      return;
    }

    this.listarNoLeidas().subscribe(
      noLeidas => this.notificaciones.set(noLeidas)
    );

    this.eventSource = new EventSourcePolyfill(`${this.url}/stream`, options);

    // El backend manda el evento con nombre custom "notificacion" (SseEmitter.event().name(...)),
    // no el evento "message" por defecto -- onmessage no se dispara para eventos con nombre propio.
    this.eventSource.addEventListener('notificacion', (event) => {

      const notificacion: Notificacion = JSON.parse((event as MessageEvent).data);

      this.notificaciones.update(actuales => [notificacion, ...actuales]);
    });
  }

  // EventSourcePolyfill no pasa por HttpClient, asi que el interceptor de credenciales nunca lo toca.
  // En COOKIE, withCredentials hace que el navegador adjunte la cookie solo (como cualquier request
  // credentialed normal); en TOKEN, no hay otra forma de mandarlo salvo el header armado a mano.
  private buildEventSourceOptions(): EventSourcePolyfillInit | null {

    if (environment.AUTH_MODE === 'COOKIE') {
      return { withCredentials: true, heartbeatTimeout: 90000 };
    }

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    if (!token) {
      return null;
    }

    return {
      headers: { Authorization: `Bearer ${token}` },
      heartbeatTimeout: 90000
    };
  }

  stop(): void {

    this.eventSource?.close();
    this.eventSource = undefined;

    this.notificaciones.set([]);
  }

  private listarNoLeidas(): Observable<Notificacion[]> {

    return this.http.get<Notificacion[]>(`${this.url}/no-leidas`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true)
    });
  }

  // Historial completo (leidas y no leidas), paginado -- para la pantalla "Ver todas".
  listarTodas(page: number, size: number): Observable<any> {

    const parametros = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(this.url, { params: parametros });
  }

  marcarLeida(notificacionId: number): void {

    this.notificaciones.update(
      actuales => actuales.filter(n => n.id !== notificacionId)
    );

    this.http.patch<void>(`${this.url}/${notificacionId}/leida`, null, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true)
    }).subscribe();
  }

  marcarTodasLeidas(): void {

    this.notificaciones.set([]);

    this.http.post<void>(`${this.url}/leidas`, null, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true)
    }).subscribe();
  }

  // Borrado logico -- el backend nunca la elimina de la tabla, solo deja de devolverla.
  eliminar(notificacionId: number): void {

    this.notificaciones.update(
      actuales => actuales.filter(n => n.id !== notificacionId)
    );

    this.http.delete<void>(`${this.url}/${notificacionId}`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, true)
    }).subscribe();
  }
}
