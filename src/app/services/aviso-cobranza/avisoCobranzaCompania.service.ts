import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CompaniaDisponible } from '../../models/aviso-cobranza/CompaniaDisponible';

@Injectable({
  providedIn: 'root',
})
export class AvisoCobranzaCompaniaService {

  private readonly url = `${environment.HOST_AVISO_COBRANZA}/avisos-cobranza/companias`;

  private readonly http = inject(HttpClient);

  listarDisponibles(): Observable<CompaniaDisponible[]> {
    return this.http.get<CompaniaDisponible[]>(this.url);
  }
}
