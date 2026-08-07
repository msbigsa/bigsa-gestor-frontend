import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CobradorDisponible } from '../../models/aviso-cobranza/CobradorDisponible';

@Injectable({
  providedIn: 'root',
})
export class AvisoCobranzaCobradorService {

  private readonly url = `${environment.HOST_AVISO_COBRANZA}/avisos-cobranza/cobradores`;

  private readonly http = inject(HttpClient);

  listarDisponibles(): Observable<CobradorDisponible[]> {
    return this.http.get<CobradorDisponible[]>(this.url);
  }
}
