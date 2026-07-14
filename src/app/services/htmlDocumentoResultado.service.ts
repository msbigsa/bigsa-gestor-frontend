import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HtmlDocumentoResultadoService {
  url = `${environment.HOST_HTML}/resultados/v1`;

  private http = inject(HttpClient);

  public descargar(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${id}/descargar`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  public eliminar(id: number): Observable<void> {

    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
