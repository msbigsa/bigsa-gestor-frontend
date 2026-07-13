import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HtmlDoc } from '../models/HtmlDoc';
import { ArchivoDoc } from '../models/ArchivoDoc';

@Injectable({
  providedIn: 'root',
})
export class HtmlDocumentoService {
  
  private http = inject(HttpClient);


   
  listarDocumentosPaginado(page: number, size: number): Observable<any> {
    const parametros = new HttpParams().set('page', page).set('size', size);

    const url = `${environment.HOST_HTML}/documentos`;

    return this.http.get<any>(`${url}/paginado`, {
      params: parametros,
    });
  }

  public obtener(id: number): Observable<ArchivoDoc> {

    const url = `${environment.HOST_HTML}/documentos`;

    return this.http.get<ArchivoDoc>(`${url}/${id}`);
  }

  public eliminar(id: any): Observable<void> {

    const url = `${environment.HOST_HTML}/documentos`;

    return this.http.delete<void>(`${url}/${id}`);
  }

}
