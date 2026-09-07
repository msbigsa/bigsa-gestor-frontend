import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SKIP_GLOBAL_LOADING } from 'src/app/interceptors/loading.token';
import { CargaArchivosResponse } from '../../models/emision-masiva/CargaArchivosResponse';
import { CargaDocumentosConfirmacion } from '../../models/emision-masiva/CargaDocumentosConfirmacion';
import { CargaDocumentosResponse } from '../../models/emision-masiva/CargaDocumentosResponse';
import { ArchivoStaging } from '../../models/emision-masiva/ArchivoStaging';

@Injectable({
  providedIn: 'root',
})
export class EmisionMasivaDocumentosService {

  private readonly url = `${environment.HOST_EMISION_MASIVA}/emision-masiva/lotes`;

  private readonly http = inject(HttpClient);

  // Sincrono: solo copia el archivo a la carpeta de staging, no dispara matching.
  subirDocumentos(loteId: number, archivo: File): Observable<CargaArchivosResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<CargaArchivosResponse>(`${this.url}/${loteId}/documentos`, formData);
  }

  // Dispara el matching en background sobre lo que haya en la carpeta en ese momento.
  procesarDocumentos(loteId: number): Observable<CargaDocumentosConfirmacion> {
    return this.http.post<CargaDocumentosConfirmacion>(`${this.url}/${loteId}/documentos/procesar`, null);
  }

  obtenerCarga(loteId: number, cargaDocId: number, silencioso = false): Observable<CargaDocumentosResponse> {
    return this.http.get<CargaDocumentosResponse>(`${this.url}/${loteId}/documentos/${cargaDocId}`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  listarCargas(loteId: number): Observable<CargaDocumentosResponse[]> {
    return this.http.get<CargaDocumentosResponse[]>(`${this.url}/${loteId}/documentos`);
  }

  // Lo que hay ahora mismo en la carpeta de staging, sin procesar -- incluye archivos dejados a mano.
  listarArchivosCarpeta(loteId: number, silencioso = false): Observable<ArchivoStaging[]> {
    return this.http.get<ArchivoStaging[]>(`${this.url}/${loteId}/documentos/carpeta`, {
      context: new HttpContext().set(SKIP_GLOBAL_LOADING, silencioso),
    });
  }

  desasignarDocumento(loteId: number, detalleId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${loteId}/detalles/${detalleId}/documento`);
  }
}
