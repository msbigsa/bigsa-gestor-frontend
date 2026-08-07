import { HttpClient, HttpContext, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { LoteCargaConfirmacion } from '../../models/aviso-cobranza/LoteCargaConfirmacion';
import { LoteCargaResponse } from '../../models/aviso-cobranza/LoteCargaResponse';
import { EstadoDetalle } from '../../models/aviso-cobranza/EstadoDetalle';
import { EstadoLote } from '../../models/aviso-cobranza/EstadoLote';

@Injectable({
  providedIn: 'root',
})
export class AvisoCobranzaLoteService {

  private readonly url = `${environment.HOST_AVISO_COBRANZA}/avisos-cobranza/lotes`;

  private readonly http = inject(HttpClient);

  cargarPlanilla(formData: FormData): Observable<LoteCargaConfirmacion> {
    return this.http.post<LoteCargaConfirmacion>(this.url, formData);
  }

  // La correccion hereda toda la configuracion del lote origen -- solo se manda el archivo nuevo.
  cargarCorreccion(loteOrigenId: number, archivo: File): Observable<LoteCargaConfirmacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<LoteCargaConfirmacion>(`${this.url}/${loteOrigenId}/correcciones`, formData);
  }

  listarLotes(
    page: number,
    size: number,
    estado?: EstadoLote,
    ciasCodigo?: number,
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

    if (ciasCodigo != null) {
      parametros = parametros.set('ciasCodigo', ciasCodigo);
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

  listarDetalles(loteId: number, page: number, size: number, estado?: EstadoDetalle, silencioso = false): Observable<any> {
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

  enviarLote(loteId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${loteId}/enviar`, null);
  }

  // Borrado en cascada: tambien elimina los lotes de correccion asociados (loteOrigenId).
  eliminarLote(loteId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${loteId}`);
  }

  eliminarDetalle(loteId: number, detalleId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${loteId}/detalles/${detalleId}`);
  }

  descargarLog(loteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${loteId}/log`, { responseType: 'blob', observe: 'response' });
  }

  descargarResumen(loteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${loteId}/resumen`, { responseType: 'blob', observe: 'response' });
  }
}
