import { Routes } from '@angular/router';

import { AppErrorComponent } from './error/error.component';
import { AppSideRegisterComponent } from './side-register/side-register.component';
import { AppBoxedLoginComponent } from './boxed-login/boxed-login.component';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        title: 'Error-404',
        path: 'error',
        component: AppErrorComponent,
      },
      {
        title: 'Login',
        path: 'login',
        component: AppBoxedLoginComponent,
      },
      {
        title: 'Register',
        path: 'register',
        component: AppSideRegisterComponent,
      },
    ],
  },
];
