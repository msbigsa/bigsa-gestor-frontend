import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ConfigsUsuario } from '../models/ConfigsUsuario';

@Injectable({
  providedIn: 'root',
})
export class ConfigsService {

  private readonly url = `${environment.HOST_LOGIN}/configs`;

  private readonly http = inject(HttpClient);

  obtenerConfigs(): Observable<ConfigsUsuario> {

    return this.http.get<ConfigsUsuario>(this.url);
  }

  actualizarConfigs(configs: ConfigsUsuario): Observable<ConfigsUsuario> {

    return this.http.put<ConfigsUsuario>(this.url, configs);
  }
}
