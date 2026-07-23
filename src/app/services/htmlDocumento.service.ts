import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArchivoDoc } from '../models/ArchivoDoc';

@Injectable({
  providedIn: 'root',
})
export class HtmlDocumentoService {
  
  url = `${environment.HOST_HTML}/documentos/v1`;

  private http = inject(HttpClient);
   
  listarDocumentosPaginado(page: number, size: number, filter: string): Observable<any> {
    const parametros = new HttpParams()
                            .set('page', page)
                            .set('size', size)
                            .set('filter', filter);    

    return this.http.get<any>(`${this.url}/paginado`, {
      params: parametros,
    });
  }

  public obtener(id: number): Observable<ArchivoDoc> {

    return this.http.get<ArchivoDoc>(`${this.url}/${id}`);
  }

  public eliminar(id: number): Observable<void> {

    return this.http.delete<void>(`${this.url}/${id}`);
  }

  public listarHtmlResultado(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}/resultados`);
  }

}
