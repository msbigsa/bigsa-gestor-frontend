import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TipoCargaDisponible } from '../../models/carga-masiva-generica/TipoCargaDisponible';

@Injectable({
  providedIn: 'root',
})
export class CargaMasivaGenericaTipoCargaService {

  private readonly url = `${environment.HOST_CARGA_MASIVA_GENERICA}/carga-masiva-generica/tipos-carga`;

  private readonly http = inject(HttpClient);

  // Solo los tipos con procesador implementado en el backend.
  listarDisponibles(): Observable<TipoCargaDisponible[]> {
    return this.http.get<TipoCargaDisponible[]>(this.url);
  }
}
