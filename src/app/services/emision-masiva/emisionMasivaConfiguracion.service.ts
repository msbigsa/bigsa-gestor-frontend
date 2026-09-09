import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ConfiguracionEmisionMasiva } from '../../models/emision-masiva/ConfiguracionEmisionMasiva';

@Injectable({
  providedIn: 'root',
})
export class EmisionMasivaConfiguracionService {

  private readonly url = `${environment.HOST_EMISION_MASIVA}/emision-masiva/configuracion`;

  private readonly http = inject(HttpClient);

  obtenerConfiguracion(): Observable<ConfiguracionEmisionMasiva> {
    return this.http.get<ConfiguracionEmisionMasiva>(this.url);
  }

  actualizarConfiguracion(configuracion: ConfiguracionEmisionMasiva): Observable<ConfiguracionEmisionMasiva> {
    return this.http.put<ConfiguracionEmisionMasiva>(this.url, configuracion);
  }
}
