import { Injectable, signal } from '@angular/core';

// Un lock exclusivo por origen (navigator.locks): garantiza que solo una pestaña autenticada
// este activa a la vez, sin heartbeats ni marcas en localStorage. El browser libera el lock solo
// cuando el contexto de la pestaña desaparece (cierre, navegacion, crash), asi que no hace falta
// listener de beforeunload ni limpieza manual.
@Injectable({
  providedIn: 'root',
})
export class TabLockService {

  private static readonly LOCK_NAME = 'bigsa-gestor-active-tab';

  readonly tabActiva = signal(false);

  private solicitado = false;
  private liberar?: () => void;

  acquire(): void {

    if (this.solicitado) {
      return;
    }

    this.solicitado = true;

    // Si el browser no soporta Web Locks, se deja pasar sin bloquear en vez de romper el login.
    if (!('locks' in navigator)) {
      this.tabActiva.set(true);
      return;
    }

    navigator.locks.request(TabLockService.LOCK_NAME, { mode: 'exclusive' }, () => {

      this.tabActiva.set(true);

      return new Promise<void>(resolve => { this.liberar = resolve; });
    });
  }

  release(): void {

    this.liberar?.();
    this.liberar = undefined;
    this.solicitado = false;
    this.tabActiva.set(false);
  }
}
