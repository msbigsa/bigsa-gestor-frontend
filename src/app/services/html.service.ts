import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HtmlService {
  
  private http = inject(HttpClient);
 
  docToHtml(formData: FormData) {
    const url = `${environment.HOST_HTML}/convertir/doc-html`;

    //console.log(`html service ${url}`);
    return this.http.post(url, formData, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  listarDocumentosPaginado(page: number, size: number): Observable<any> {
    const parametros = new HttpParams().set('page', page).set('size', size);

    const url = `${environment.HOST_HTML}/documentos`;

    return this.http.get<any>(`${url}/paginado`, {
      params: parametros,
    });
  }

  public eliminar(id: any): Observable<void> {

    const url = `${environment.HOST_HTML}/documentos`;

    return this.http.delete<void>(`${url}/${id}`);
  }

}
