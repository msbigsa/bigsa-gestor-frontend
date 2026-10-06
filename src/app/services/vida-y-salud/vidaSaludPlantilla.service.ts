import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormatoDisponible } from '../../models/vida-y-salud/FormatoDisponible';

@Injectable({
  providedIn: 'root',
})
export class VidaSaludPlantillaService {

  private readonly url = `${environment.HOST_VIDA_Y_SALUD}/vida-y-salud/plantillas`;

  private readonly http = inject(HttpClient);

  listarDisponibles(): Observable<FormatoDisponible[]> {
    return this.http.get<FormatoDisponible[]>(this.url);
  }
}
