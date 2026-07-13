import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HtmlDoc } from '../models/HtmlDoc';

@Injectable({
  providedIn: 'root',
})
export class HtmlService {
  
  private http = inject(HttpClient);
 
  docToHtml(formData: FormData): Observable<HtmlDoc> {
    const url = `${environment.HOST_HTML}/convertir/v1/doc-html`;

    //console.log(`html service ${url}`);
    return this.http.post<HtmlDoc>(url, formData);
  }

}
