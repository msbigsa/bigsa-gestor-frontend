import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ItemCatalogo } from '../../models/carga-masiva-generica/ItemCatalogo';
import { Moneda } from '../../models/carga-masiva-generica/Moneda';
import { PlanPago } from '../../models/carga-masiva-generica/PlanPago';

// Catalogos de la pantalla de carga; replican los "help" del VB6.
@Injectable({
  providedIn: 'root',
})
export class CargaMasivaGenericaCatalogoService {

  private readonly url = `${environment.HOST_CARGA_MASIVA_GENERICA}/carga-masiva-generica`;

  private readonly http = inject(HttpClient);

  // Solo companias vigentes.
  listarCompanias(): Observable<ItemCatalogo[]> {
    return this.http.get<ItemCatalogo[]>(`${this.url}/companias`);
  }

  listarNegocios(ciasCodigo: number): Observable<ItemCatalogo[]> {
    return this.http.get<ItemCatalogo[]>(`${this.url}/companias/${ciasCodigo}/negocios`);
  }

  // Todos los ramos: el help del VB6 no filtra por compania ni negocio.
  listarRamos(): Observable<ItemCatalogo[]> {
    return this.http.get<ItemCatalogo[]>(`${this.url}/ramos`);
  }

  // codigo = plcoCorrelativo.
  listarPlanesCobertura(ciasCodigo: number, negoCodigo: number, ramoCodigo: number): Observable<ItemCatalogo[]> {
    const params = new HttpParams()
      .set('ciasCodigo', ciasCodigo)
      .set('negoCodigo', negoCodigo)
      .set('ramoCodigo', ramoCodigo);

    return this.http.get<ItemCatalogo[]>(`${this.url}/planes-cobertura`, { params });
  }

  listarMonedas(): Observable<Moneda[]> {
    return this.http.get<Moneda[]>(`${this.url}/monedas`);
  }

  listarPlanesPago(): Observable<PlanPago[]> {
    return this.http.get<PlanPago[]>(`${this.url}/planes-pago`);
  }

  // tipo 1 = tarjetas, tipo 2 = bancos.
  listarInstituciones(tipo: 1 | 2): Observable<ItemCatalogo[]> {
    return this.http.get<ItemCatalogo[]>(`${this.url}/instituciones-financieras`, { params: { tipo } });
  }
}
