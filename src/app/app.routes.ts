import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppErrorComponent } from './pages/authentication/error/error.component';
import { ForbiddenComponent } from './pages/authentication/forbidden/forbidden.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/inicio',
        pathMatch: 'full',        
      },
      {
        path: 'inicio',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      }
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: 'noEncontrado',
    component: AppErrorComponent,
  },
  {
    path: 'prohibido',
    component: ForbiddenComponent,
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
