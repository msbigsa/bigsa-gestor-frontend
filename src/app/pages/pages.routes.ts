import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { CertGuard } from '../guard/cert.guard';
import { WordHtmlConverterComponent } from './word-html-converter/word-html-converter.component';

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
  {
    path: 'conversor-doc-html',
    component: WordHtmlConverterComponent,
    data: {
      title: 'Convertir Word a HTML'      
    },
    canActivate: [CertGuard]
  },
];
