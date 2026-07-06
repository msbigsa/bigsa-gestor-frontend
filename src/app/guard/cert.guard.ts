import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";

import { JwtHelperService } from '@auth0/angular-jwt';
import { map } from "rxjs";

import { environment } from "src/environments/environment";
import { LoginService } from "../services/login.service";


export const CertGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const router = inject(Router);
    const loginService = inject(LoginService);
    //const menuService = inject(MenuService);

    //1) VERIFICAR SI EL USUARIO ESTA LOGUEADO
    const rpta = loginService.isLogged();
    if(!rpta){
        loginService.logout();
        return false;
    }
    //2) VERIFICAR SI EL TOKEN NO HA EXPIRADO
    const helper = new JwtHelperService();
    const token = sessionStorage.getItem(environment.TOKEN_NAME);

    if(token && !helper.isTokenExpired(token)){
        //3) VERIFICAR SI TIENES EL ROL NECESARIO PARA ACCEDER A ESE COMPONENTE 'PAGINA'
        //url -> /pages/patient
        const url = state.url;
        //console.log(url);        
        
        const decodedToken = helper.decodeToken(token);     

        const username = decodedToken.sub;

        return true;

       /* return menuService.getMenusByUser(username).pipe(map( (data: Menu[]) => {
            //menuService.setMenuChange(data);

            let count = 0;
            for(let m of data){
                                
              if(url.startsWith(m.url || '')){
                //console.log(m.url);                
                count++;
                break;
              }
            }

            if(count > 0){
                return true;
            }else{
                router.navigate(['/auth/access']);
                return false;
            }
        }));*/

    }else{
        loginService.logout();
        return false;
    }
}