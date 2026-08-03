import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppErrorComponent } from './pages/authentication/error/error.component';

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
    path: '**',
    redirectTo: 'authentication/error',
  },
];
