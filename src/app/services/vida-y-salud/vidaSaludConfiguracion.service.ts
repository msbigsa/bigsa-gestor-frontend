import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ConfiguracionVidaSalud } from '../../models/vida-y-salud/ConfiguracionVidaSalud';

@Injectable({
  providedIn: 'root',
})
export class VidaSaludConfiguracionService {

  private readonly url = `${environment.HOST_VIDA_Y_SALUD}/vida-y-salud/configuracion`;

  private readonly http = inject(HttpClient);

  obtenerConfiguracion(): Observable<ConfiguracionVidaSalud> {
    return this.http.get<ConfiguracionVidaSalud>(this.url);
  }

  actualizarConfiguracion(configuracion: ConfiguracionVidaSalud): Observable<ConfiguracionVidaSalud> {
    return this.http.put<ConfiguracionVidaSalud>(this.url, configuracion);
  }
}
