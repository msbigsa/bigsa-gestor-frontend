import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CompaniaDisponible } from '../../models/vida-y-salud/CompaniaDisponible';

@Injectable({
  providedIn: 'root',
})
export class VidaSaludCompaniaService {

  private readonly url = `${environment.HOST_VIDA_Y_SALUD}/vida-y-salud/companias`;

  private readonly http = inject(HttpClient);

  listarDisponibles(): Observable<CompaniaDisponible[]> {
    return this.http.get<CompaniaDisponible[]>(this.url);
  }
}
