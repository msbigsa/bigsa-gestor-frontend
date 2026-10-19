import { HttpClient, HttpContext, HttpParams, HttpResponse } from '@angular/common/http';

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { LoteCargaConfirmacion } from '../../models/carga-masiva-generica/LoteCargaConfirmacion';
import { LoteCargaResponse } from '../../models/carga-masiva-generica/LoteCargaResponse';
import { EstadoLoteCarga } from '../../models/carga-masiva-generica/EstadoLoteCarga';
import { EstadoDetalleCarga } from '../../models/carga-masiva-generica/EstadoDetalleCarga';
import { TipoCarga } from '../../models/carga-masiva-generica/TipoCarga';

@Injectable({
  providedIn: 'root',
})
export class CargaMasivaGenericaLoteService {

  private readonly url = `${environment.HOST_CARGA_MASIVA_GENERICA}/carga-masiva-generica/lotes`;

  private readonly http = inject(HttpClient);

  cargarLote(formData: FormData): Observable<LoteCargaConfirmacion> {
    return this.http.post<LoteCargaConfirmacion>(this.url, formData);
  }

  // La correccion hereda el tipo de carga y todos los parametros del lote origen -- solo se manda el archivo.
  cargarCorreccion(loteOrigenId: number, archivo: File): Observable<LoteCargaConfirmacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<LoteCargaConfirmacion>(`${this.url}/${loteOrigenId}/correcciones`, formData);
  }

  listarLotes(
    page: number,
    size: number,
    estado?: EstadoLoteCarga,
    tipoCarga?: TipoCarga,
    silencioso = false,
    incluirEliminados = false,
  ): Observable<any> {
    let parametros = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('incluirEliminados', incluirEliminados);

    if (estado) {
      parametros = parametros.set('estado', estado);
    }

    if (tipoCarga) {
      parametros = parametros.set('tipoCarga', tipoCarga);
    }

    return this.http.get<any>(this.url, {
      params: parametros,
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  obtenerLote(loteId: number, silencioso = false): Observable<LoteCargaResponse> {
    return this.http.get<LoteCargaResponse>(`${this.url}/${loteId}`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  // Lotes que son correccion directa del lote dado -- lista simple, sin paginar.
  listarCorrecciones(loteId: number): Observable<LoteCargaResponse[]> {
    return this.http.get<LoteCargaResponse[]>(`${this.url}/${loteId}/correcciones`);
  }

  validarLote(loteId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${loteId}/validar`, null);
  }

  // Sin ejecutarLote: la fase de ejecucion aun no tiene endpoint en el backend (corte D-17).

  listarDetalles(loteId: number, page: number, size: number, estado?: EstadoDetalleCarga, silencioso = false): Observable<any> {
    let parametros = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (estado) {
      parametros = parametros.set('estado', estado);
    }

    return this.http.get<any>(`${this.url}/${loteId}/detalles`, {
      params: parametros,
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  // hijosAEliminar: ids de correcciones a eliminar tambien; el resto queda standalone.
  eliminarLote(loteId: number, hijosAEliminar: number[] = []): Observable<void> {
    let parametros = new HttpParams();
    hijosAEliminar.forEach(id => parametros = parametros.append('hijosAEliminar', id));

    return this.http.delete<void>(`${this.url}/${loteId}`, { params: parametros });
  }

  eliminarDetalle(loteId: number, detalleId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${loteId}/detalles/${detalleId}`);
  }

  // Uso administrativo: fuerza el estado sin pasar por las transiciones normales.
  forzarEstado(loteId: number, estado: EstadoLoteCarga): Observable<void> {
    return this.http.put<void>(`${this.url}/${loteId}/estado`, null, { params: { estado } });
  }

  descargarLog(loteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${loteId}/log`, { responseType: 'blob', observe: 'response' });
  }

  descargarResumen(loteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${loteId}/resumen`, { responseType: 'blob', observe: 'response' });
  }
}
