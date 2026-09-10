import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";

import { JwtHelperService } from '@auth0/angular-jwt';
import { catchError, map, of } from "rxjs";

import { environment } from "src/environments/environment";
import { LoginService } from "../services/login.service";
import { MenuService } from "../layouts/full/vertical/sidebar/sidebar-data";

const RUTAS_LIBRES = ['/inicio', '/inicio/perfil', '/inicio/notificaciones'];

export const CertGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const router = inject(Router);
    const loginService = inject(LoginService);
    const menuService = inject(MenuService);

    //1) VERIFICAR SI EL USUARIO ESTA LOGUEADO
    const rpta = loginService.isLogged();
    if(!rpta){
        loginService.logout();
        return false;
    }

    //2) VERIFICAR SI EL TOKEN NO HA EXPIRADO -- solo posible en modo TOKEN.
    //   En modo COOKIE el JWT es HttpOnly, JS no puede leerlo ni decodificarlo:
    //   la expiracion la termina resolviendo el propio backend (401/403) en el paso 4.
    if (environment.AUTH_MODE !== 'COOKIE') {
        const helper = new JwtHelperService();
        const token = sessionStorage.getItem(environment.TOKEN_NAME);

        if (!token || helper.isTokenExpired(token)) {
            loginService.logout();
            return false;
        }
    }

    const url = state.url;

    //3) RUTAS LIBRES: SIEMPRE ACCESIBLES CON SOLO ESTAR LOGUEADO, SIN VALIDAR CONTRA LA BD
    if(RUTAS_LIBRES.includes(url)){
        return true;
    }

    //4) VERIFICAR SI TIENE PERMISO ASIGNADO PARA ESTA PANTALLA
    return menuService.validarAcceso(url).pipe(
        map(acceso => {
            if(acceso.permitido){
                return true;
            }
            router.navigate(['/prohibido']);
            return false;
        }),
        // fail-closed: si la validacion falla o el servicio no responde, se bloquea la navegacion
        catchError(() => {
            router.navigate(['/noEncontrado']);
            return of(false);
        })
    );
}
