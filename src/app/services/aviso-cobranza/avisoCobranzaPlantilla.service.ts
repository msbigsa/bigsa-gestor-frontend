import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormatoDisponible } from '../../models/aviso-cobranza/FormatoDisponible';

@Injectable({
  providedIn: 'root',
})
export class AvisoCobranzaPlantillaService {

  private readonly url = `${environment.HOST_AVISO_COBRANZA}/avisos-cobranza/plantillas`;

  private readonly http = inject(HttpClient);

  listarDisponibles(): Observable<FormatoDisponible[]> {
    return this.http.get<FormatoDisponible[]>(this.url);
  }
}
