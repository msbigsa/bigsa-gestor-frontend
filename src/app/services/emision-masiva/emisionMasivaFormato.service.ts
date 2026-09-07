import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormatoDisponible } from '../../models/emision-masiva/FormatoDisponible';

@Injectable({
  providedIn: 'root',
})
export class EmisionMasivaFormatoService {

  private readonly url = `${environment.HOST_EMISION_MASIVA}/emision-masiva/formatos`;

  private readonly http = inject(HttpClient);

  listarDisponibles(): Observable<FormatoDisponible[]> {
    return this.http.get<FormatoDisponible[]>(this.url);
  }
}
