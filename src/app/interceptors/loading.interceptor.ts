import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { finalize } from 'rxjs';
import { SKIP_GLOBAL_LOADING } from './loading.token';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(NgxUiLoaderService);

  const skipLoading = req.context.get(SKIP_GLOBAL_LOADING);

  if (!skipLoading) {
    loader.start();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loader.stop();
      }
    })
  );
};
