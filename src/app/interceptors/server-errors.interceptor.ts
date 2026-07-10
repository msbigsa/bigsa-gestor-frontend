import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
//import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, retry } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { environment } from 'src/environments/environment';

export const serverErrorInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  //const snackBar = inject(MatSnackBar);
  const toastr = inject(ToastrService);

  return next(req).pipe(

    retry(environment.REINTENTS),

    catchError((error: HttpErrorResponse) => {

      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {

        errorMessage = `Error en cliente: ${error.error.message}`;

      } else {

        switch (error.status) {

          case 400:
            errorMessage = 'Solicitud incorrecta';
            break;

          case 401:
          case 403:
            errorMessage = 'No autorizado o prohibido';
            router.navigate(['/authentication/login']);
            break;

          case 404:
            errorMessage = 'Recurso no encontrado';
            break;

          case 500:

            errorMessage = 'Error interno del servidor';

            if (error.error?.mensaje === 'INVALID_CREDENTIALS') {
              errorMessage = 'Credenciales incorrectas';
            }

            if (error.error?.mensaje === 'USER_DISABLED') {
              errorMessage = 'Usuario bloqueado';
            }

            break;

          default:
            errorMessage = 'Ha ocurrido un error inesperado';
            break;
        }

      }

      /*snackBar.open(
        errorMessage,
        'Cerrar',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );*/

      toastr.error(errorMessage, 'Error');

      return throwError(() => error);

    })

  );

};