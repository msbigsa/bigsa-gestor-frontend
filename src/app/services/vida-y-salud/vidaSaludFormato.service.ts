import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlantillaContenido } from '../../models/vida-y-salud/PlantillaContenido';

@Injectable({
  providedIn: 'root',
})
export class VidaSaludFormatoService {

  private readonly url = `${environment.HOST_VIDA_Y_SALUD}/vida-y-salud/formatos`;

  private readonly http = inject(HttpClient);

  previsualizar(formCodigo: number): Observable<PlantillaContenido> {
    return this.http.get<PlantillaContenido>(`${this.url}/${formCodigo}/previsualizacion`);
  }
}
