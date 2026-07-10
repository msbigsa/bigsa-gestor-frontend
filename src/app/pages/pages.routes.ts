import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { CertGuard } from '../guard/cert.guard';
import { WordHtmlConverterComponent } from './html/word-html-converter/word-html-converter.component';
import { ListDocHtmlComponent } from './html/list-doc-html/list-doc-html.component';

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
    path: 'html/conversor-doc-html',
    component: WordHtmlConverterComponent,
    data: {
      title: 'Convertir Word a HTML'      
    },
    canActivate: [CertGuard]
  },
  {
    path: 'html/listar-doc-html',
    component: ListDocHtmlComponent,
    data: {
      title: 'HTML Generados'      
    },
    canActivate: [CertGuard]
  },
  
];
