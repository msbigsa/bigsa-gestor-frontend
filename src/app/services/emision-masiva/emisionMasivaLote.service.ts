import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { LoteEmisionConfirmacion } from '../../models/emision-masiva/LoteEmisionConfirmacion';
import { LoteEmisionResponse } from '../../models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from '../../models/emision-masiva/EstadoLoteEmision';
import { EstadoDetalleEmision } from '../../models/emision-masiva/EstadoDetalleEmision';

@Injectable({
  providedIn: 'root',
})
export class EmisionMasivaLoteService {

  private readonly url = `${environment.HOST_EMISION_MASIVA}/emision-masiva/lotes`;

  private readonly http = inject(HttpClient);

  cargarLote(formData: FormData): Observable<LoteEmisionConfirmacion> {
    return this.http.post<LoteEmisionConfirmacion>(this.url, formData);
  }

  // La correccion hereda toda la configuracion del lote origen -- solo se manda el archivo nuevo.
  cargarCorreccion(loteOrigenId: number, archivo: File): Observable<LoteEmisionConfirmacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<LoteEmisionConfirmacion>(`${this.url}/${loteOrigenId}/correcciones`, formData);
  }

  listarLotes(
    page: number,
    size: number,
    estado?: EstadoLoteEmision,
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

  obtenerLote(loteId: number, silencioso = false): Observable<LoteEmisionResponse> {
    return this.http.get<LoteEmisionResponse>(`${this.url}/${loteId}`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  // Lotes que son correccion directa del lote dado -- lista simple, sin paginar.
  listarCorrecciones(loteId: number): Observable<LoteEmisionResponse[]> {
    return this.http.get<LoteEmisionResponse[]>(`${this.url}/${loteId}/correcciones`);
  }

  validarLote(loteId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${loteId}/validar`, null);
  }

  // Reintentable: el mismo endpoint sirve para la primera emision y para reintentar filas con error
  // (EMITIDO_CON_ERRORES/ERROR_EMISION) -- una fila ya EMITIDO nunca se re-ejecuta, solo se retoman
  // traspaso/correo pendientes.
  emitirLote(loteId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${loteId}/emision`, null);
  }

  listarDetalles(loteId: number, page: number, size: number, estado?: EstadoDetalleEmision, silencioso = false): Observable<any> {
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

  // Uso administrativo: fuerza el estado sin pasar por las transiciones normales.
  forzarEstado(loteId: number, estado: EstadoLoteEmision): Observable<void> {
    return this.http.put<void>(`${this.url}/${loteId}/estado`, null, { params: { estado } });
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
}
