import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HtmlDoc } from '../models/HtmlDoc';

@Injectable({
  providedIn: 'root',
})
export class HtmlService {

  url = `${environment.HOST_HTML}/convertir/v1`;
  
  private http = inject(HttpClient);
 
  docToHtml(formData: FormData): Observable<HtmlDoc> {    
    //console.log(`html service ${url}`);    
    return this.http.post<HtmlDoc>(`${this.url}/doc-html`, formData);
  }

  actualizaDocToHtml(formData: FormData, id: number): Observable<HtmlDoc> {
    //console.log(`html service ${url}`);
    return this.http.post<HtmlDoc>(`${this.url}/doc-html/${id}`, formData);
  }

}
