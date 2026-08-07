import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { CertGuard } from '../guard/cert.guard';
import { WordHtmlConverterComponent } from './html/word-html-converter/word-html-converter.component';
import { ListDocHtmlComponent } from './html/list-doc-html/list-doc-html.component';
import { ResultadoDocHtmlComponent } from './html/resultado-doc-html/resultado-doc-html.component';
import { CargarLoteComponent } from './aviso-cobranza/cargar-lote/cargar-lote.component';
import { ListarLotesComponent } from './aviso-cobranza/listar-lotes/listar-lotes.component';
import { DetalleLoteComponent } from './aviso-cobranza/detalle-lote/detalle-lote.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Inicio',
      urls: [
        //{ title: 'Dashboard', url: '/dashboards/dashboard1' },
        //{ title: 'Starter Page' },
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
    path: 'html/actualizar-doc-html/:id',
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
  {
    path: 'html/resultado-doc-html/:id',
    component: ResultadoDocHtmlComponent,
    data: {
      title: 'HTML Generados por Documento Word'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'avisos-cobranza/cargar-lote',
    component: CargarLoteComponent,
    data: {
      title: 'Cargar Planilla de Avisos de Cobranza'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'avisos-cobranza/listar-lotes',
    component: ListarLotesComponent,
    data: {
      title: 'Lotes de Avisos de Cobranza'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'avisos-cobranza/detalle-lote/:id',
    component: DetalleLoteComponent,
    data: {
      title: 'Detalle de Lote de Avisos de Cobranza'
    },
    canActivate: [CertGuard]
  },

];
