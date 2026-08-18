import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AccesoMenu, CategoriaMenu } from 'src/app/models/Menu';
import { NavItem } from './nav-item/nav-item';

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private readonly url = `${environment.HOST_LOGIN}/menu`;

  private readonly http = inject(HttpClient);

  obtenerMenu(): Observable<CategoriaMenu[]> {
    return this.http.get<CategoriaMenu[]>(this.url);
  }

  validarAcceso(ruta: string): Observable<AccesoMenu> {
    return this.http.get<AccesoMenu>(`${this.url}/validar`, { params: { ruta } });
  }

  construirNavItems(categorias: CategoriaMenu[]): NavItem[] {

    const navItems: NavItem[] = [
      { navCap: 'General' },
      {
        displayName: 'Inicio',
        iconName: 'solar:home-angle-line-duotone',
        route: '/inicio',
      },
    ];

    for (const categoria of categorias) {
      navItems.push({ navCap: categoria.category });

      for (const modulo of categoria.modulos) {
        navItems.push({
          displayName: modulo.displayName,
          iconName: modulo.iconName,
          route: modulo.route,
          children: modulo.children.map(hijo => ({
            displayName: hijo.displayName,
            iconName: hijo.iconName,
            route: hijo.route,
          })),
        });
      }
    }

    return navItems;
  }
}
