import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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

}
