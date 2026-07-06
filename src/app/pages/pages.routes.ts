import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { CertGuard } from '../guard/cert.guard';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Starter Page',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Starter Page' },
      ],
    },
    canActivate: [CertGuard]
  },
];
