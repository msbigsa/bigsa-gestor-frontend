import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Cola } from '../../models/cola-ejecucion/Cola';
import { GrupoCola } from '../../models/cola-ejecucion/GrupoCola';
import { CancelacionSolicitud } from '../../models/cola-ejecucion/CancelacionSolicitud';

@Injectable({
  providedIn: 'root',
})
export class ColaEjecucionService {

  private readonly url = `${environment.HOST_SCHEDULER}/scheduler/cola`;

  private readonly http = inject(HttpClient);

  consultar(): Observable<Cola> {
    return this.http.get<Cola>(this.url);
  }

  // La mas reciente primero; size hasta 100.
  listarTerminadas(page: number, size: number): Observable<any> {
    const parametros = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(`${this.url}/terminadas`, { params: parametros });
  }

  // Cualquier usuario; devuelve el grupo ya renumerado.
  reordenar(idSolicitud: number, posicion: number): Observable<GrupoCola> {
    return this.http.put<GrupoCola>(`${this.url}/${idSolicitud}/posicion`, { posicion });
  }

  // Solo las propias.
  cancelar(idSolicitud: number): Observable<CancelacionSolicitud> {
    return this.http.post<CancelacionSolicitud>(`${this.url}/${idSolicitud}/cancelar`, null);
  }
}
