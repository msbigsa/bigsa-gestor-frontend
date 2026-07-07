import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HtmlService {

  private http = inject(HttpClient);

  private url = `${environment.HOST_HTML}/convertir/doc-html`;

  docToHtml(formData: FormData) {
    console.log(`html service ${this.url}`);
    return this.http.post(this.url, formData, {
      responseType: 'blob',
      observe: 'response'
    });
  }

}
