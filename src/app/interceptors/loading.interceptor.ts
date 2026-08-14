import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { finalize } from 'rxjs';
import { SKIP_GLOBAL_LOADING } from './loading.token';

let taskCounter = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(NgxUiLoaderService);

  const skipLoading = req.context.get(SKIP_GLOBAL_LOADING);
  // ngx-ui-loader identifica cada carga por taskId; sin uno propio por request, dos peticiones
  // concurrentes comparten la misma tarea y la primera en terminar oculta el loader aunque la
  // otra siga en curso.
  const taskId = `http-loading-${++taskCounter}`;

  if (!skipLoading) {
    loader.start(taskId);
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loader.stop(taskId);
      }
    })
  );
};
