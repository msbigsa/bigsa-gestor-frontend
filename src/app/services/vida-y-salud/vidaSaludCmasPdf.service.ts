import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CmasPdf } from '../../models/vida-y-salud/CmasPdf';

// Mantenedor de CMAS_PDF (config de matching/archivo por compania) -- sin DELETE, el backend no lo expone.
@Injectable({
  providedIn: 'root',
})
export class VidaSaludCmasPdfService {

  private readonly url = `${environment.HOST_VIDA_Y_SALUD}/vida-y-salud/companias-mantenedor`;

  private readonly http = inject(HttpClient);

  listar(): Observable<CmasPdf[]> {
    return this.http.get<CmasPdf[]>(this.url);
  }

  obtener(ciasCodigo: number): Observable<CmasPdf> {
    return this.http.get<CmasPdf>(`${this.url}/${ciasCodigo}`);
  }

  crear(cmasPdf: CmasPdf): Observable<CmasPdf> {
    return this.http.post<CmasPdf>(this.url, cmasPdf);
  }

  actualizar(ciasCodigo: number, cmasPdf: CmasPdf): Observable<CmasPdf> {
    return this.http.put<CmasPdf>(`${this.url}/${ciasCodigo}`, cmasPdf);
  }
}
