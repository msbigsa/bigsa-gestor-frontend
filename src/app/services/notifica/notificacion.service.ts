import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { EventSourcePolyfill } from 'event-source-polyfill';

import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { Notificacion } from '../../models/notifica/Notificacion';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {

  private readonly url = `${environment.HOST_NOTIFICA}/notificaciones`;

  private readonly http = inject(HttpClient);

  private eventSource?: EventSourcePolyfill;

  // Un solo interruptor en environment.ts -- si el backend de notificaciones da problemas, se apaga
  // aca sin tocar mas codigo. El header lo usa para ocultar la campanita.
  readonly habilitado = environment.NOTIFICACIONES_HABILITADAS;

  readonly notificaciones = signal<Notificacion[]>([]);

  readonly cantidadNoLeidas = computed(() => this.notificaciones().length);

  // Se llama al iniciar sesion y cada vez que se refresca el token (ver LoginService),
  // para que el stream siempre viaje con un Bearer vigente.
  start(): void {

    this.stop();

    if (!this.habilitado) {
      return;
    }

    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    if (!token) {
      return;
    }

    this.listarNoLeidas().subscribe(
      noLeidas => this.notificaciones.set(noLeidas)
    );

    this.eventSource = new EventSourcePolyfill(`${this.url}/stream`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      heartbeatTimeout: 90000
    });

    // El backend manda el evento con nombre custom "notificacion" (SseEmitter.event().name(...)),
    // no el evento "message" por defecto -- onmessage no se dispara para eventos con nombre propio.
    this.eventSource.addEventListener('notificacion', (event) => {

      const notificacion: Notificacion = JSON.parse((event as MessageEvent).data);

      this.notificaciones.update(actuales => [notificacion, ...actuales]);
    });
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
