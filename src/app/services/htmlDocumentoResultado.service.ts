import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HtmlDoc } from '../models/HtmlDoc';

@Injectable({
  providedIn: 'root',
})
export class HtmlDocumentoResultadoService {
  private readonly url = `${environment.HOST_HTML}/resultados/v1`;

  private readonly http = inject(HttpClient);

  public descargar(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/${id}/descargar`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  public descargarArchivo(id: number): void {
    this.descargar(id).subscribe((response) => {
      const blob = response.body!;

      const contentDisposition =
        response.headers.get('Content-Disposition');

      let nombreArchivo = 'archivo.zip';

      //console.log(contentDisposition);

      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename="?([^"]+)"?/
        );

        if (match) {
          nombreArchivo = match[1];
        }
      }

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

   public descargarHtml(idResultado: number): Observable<HtmlDoc> {
    return this.http.get<HtmlDoc>(
      `${this.url}/${idResultado}/descargar-html`);
  }

  public eliminar(id: number): Observable<void> {

    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
