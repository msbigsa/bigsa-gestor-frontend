import { HttpClient, HttpContext, HttpParams, HttpResponse } from '@angular/common/http';

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { LoteVidaSaludConfirmacion } from '../../models/vida-y-salud/LoteVidaSaludConfirmacion';
import { LoteVidaSaludResponse } from '../../models/vida-y-salud/LoteVidaSaludResponse';
import { EstadoLoteVidaSalud } from '../../models/vida-y-salud/EstadoLoteVidaSalud';
import { EstadoDetalleVidaSalud } from '../../models/vida-y-salud/EstadoDetalleVidaSalud';
import { LoteVidaSaludDetalleResponse } from '../../models/vida-y-salud/LoteVidaSaludDetalleResponse';

@Injectable({
  providedIn: 'root',
})
export class VidaSaludLoteService {

  private readonly url = `${environment.HOST_VIDA_Y_SALUD}/vida-y-salud/lotes`;

  private readonly http = inject(HttpClient);

  cargarLote(formData: FormData): Observable<LoteVidaSaludConfirmacion> {
    return this.http.post<LoteVidaSaludConfirmacion>(this.url, formData);
  }

  // La correccion hereda toda la configuracion del lote origen -- solo se manda el archivo nuevo.
  cargarCorreccion(loteOrigenId: number, archivo: File): Observable<LoteVidaSaludConfirmacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<LoteVidaSaludConfirmacion>(`${this.url}/${loteOrigenId}/correcciones`, formData);
  }

  // Sin filtro por compania -- este backend no lo soporta en el listado (a diferencia de aviso-cobranza).
  listarLotes(
    page: number,
    size: number,
    estado?: EstadoLoteVidaSalud,
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

    return this.http.get<any>(this.url, {
      params: parametros,
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  obtenerLote(loteId: number, silencioso = false): Observable<LoteVidaSaludResponse> {
    return this.http.get<LoteVidaSaludResponse>(`${this.url}/${loteId}`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  // Lotes que son correccion directa del lote dado -- lista simple, sin paginar.
  listarCorrecciones(loteId: number): Observable<LoteVidaSaludResponse[]> {
    return this.http.get<LoteVidaSaludResponse[]>(`${this.url}/${loteId}/correcciones`);
  }

  validarLote(loteId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${loteId}/validar`, null);
  }

  // Reintentable: el mismo endpoint sirve para la primera facturacion y para reintentar filas con
  // error (FACTURADO_CON_ERRORES/ERROR_FACTURACION) -- una fila ya FACTURADO nunca se re-ejecuta,
  // solo se retoma el correo pendiente.
  facturarLote(loteId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${loteId}/facturar`, null);
  }

  listarDetalles(loteId: number, page: number, size: number, estado?: EstadoDetalleVidaSalud, silencioso = false): Observable<any> {
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
  forzarEstado(loteId: number, estado: EstadoLoteVidaSalud): Observable<void> {
    return this.http.put<void>(`${this.url}/${loteId}/estado`, null, { params: { estado } });
  }

  descargarLog(loteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${loteId}/log`, { responseType: 'blob', observe: 'response' });
  }

  descargarResumen(loteId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${loteId}/resumen`, { responseType: 'blob', observe: 'response' });
  }
}
