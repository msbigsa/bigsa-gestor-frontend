import { HttpInterceptorFn } from '@angular/common/http';

// En modo TOKEN no hay cookie que enviar, asi que esto es un no-op inofensivo.
// En modo COOKIE es lo que permite al navegador guardar y reenviar la cookie de sesion
// entre los distintos microservicios.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {

  const cloned = req.clone({ withCredentials: true });

  return next(cloned);
};
