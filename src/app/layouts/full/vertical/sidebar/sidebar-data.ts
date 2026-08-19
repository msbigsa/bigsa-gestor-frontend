import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AccesoMenu, CategoriaMenu } from 'src/app/models/Menu';
import { NavItem } from './nav-item/nav-item';

// Se ancla aparte del listado normal de modulos (ver construirNavItems/obtenerAdministracion).
const RUTA_ADMINISTRACION = '/inicio/administracion';

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private readonly url = `${environment.HOST_LOGIN}/menu`;

  private readonly http = inject(HttpClient);

  // Rutas del último menú cargado (ver obtenerMenu/tap más abajo). Permite a la UI
  // preguntar "¿tengo acceso a esta ruta?" sin volver a golpear la BD (validarAcceso),
  // p.ej. para ocultar botones/atajos que apuntan a pantallas sin permiso.
  private readonly rutasPermitidas = signal<ReadonlySet<string>>(new Set());

  obtenerMenu(): Observable<CategoriaMenu[]> {
    return this.http.get<CategoriaMenu[]>(this.url).pipe(
      tap(categorias => this.rutasPermitidas.set(this.extraerRutas(categorias)))
    );
  }

  validarAcceso(ruta: string): Observable<AccesoMenu> {
    return this.http.get<AccesoMenu>(`${this.url}/validar`, { params: { ruta } });
  }

  /**
   * Indica si el menú ya cargado incluye la ruta dada. No consulta la BD: se basa en
   * el resultado del último obtenerMenu(), por lo que hasta que ese menú cargue
   * (normalmente al iniciar el layout) retorna false.
   */
  tieneAcceso(ruta: string): boolean {
    return this.rutasPermitidas().has(this.normalizarRuta(ruta));
  }

  private extraerRutas(categorias: CategoriaMenu[]): ReadonlySet<string> {
    const rutas = new Set<string>();

    for (const categoria of categorias) {
      for (const modulo of categoria.modulos) {
        rutas.add(this.normalizarRuta(modulo.route));

        for (const hijo of modulo.children) {
          rutas.add(this.normalizarRuta(hijo.route));
        }
      }
    }

    return rutas;
  }

  private normalizarRuta(ruta: string): string {
    return ruta.startsWith('/') ? ruta : `/${ruta}`;
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
      // Administracion no se mezcla con el resto - se ancla aparte.
      // Se oculta categoria sin modulos o modulos invisibles.
      const modulosVisibles: NavItem[] = [];

      for (const modulo of categoria.modulos) {
        const children = modulo.children.filter(hijo => !this.esRutaAdministracion(hijo.route));
        if (children.length === 0) {
          continue;
        }

        modulosVisibles.push({
          displayName: modulo.displayName,
          iconName: modulo.iconName,
          route: modulo.route,
          children: children.map(hijo => ({
            displayName: hijo.displayName,
            iconName: hijo.iconName,
            route: hijo.route,
          })),
        });
      }

      if (modulosVisibles.length === 0) {
        continue;
      }

      navItems.push({ navCap: categoria.category }, ...modulosVisibles);
    }

    return navItems;
  }

  /** Item de Administracion, si el usuario tiene el modulo, para anclarlo aparte del listado normal. */
  obtenerAdministracion(categorias: CategoriaMenu[]): NavItem | null {
    for (const categoria of categorias) {
      for (const modulo of categoria.modulos) {
        const hijo = modulo.children.find(h => this.esRutaAdministracion(h.route));
        if (hijo) {
          return {
            displayName: hijo.displayName,
            iconName: hijo.iconName,
            route: hijo.route,
          };
        }
      }
    }

    return null;
  }

  private esRutaAdministracion(ruta: string): boolean {
    return this.normalizarRuta(ruta) === RUTA_ADMINISTRACION;
  }
}
