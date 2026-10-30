import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { CertGuard } from '../guard/cert.guard';
import { WordHtmlConverterComponent } from './html/word-html-converter/word-html-converter.component';
import { ListDocHtmlComponent } from './html/list-doc-html/list-doc-html.component';
import { ResultadoDocHtmlComponent } from './html/resultado-doc-html/resultado-doc-html.component';
import { CargarLoteComponent } from './aviso-cobranza/cargar-lote/cargar-lote.component';
import { ListarLotesComponent } from './aviso-cobranza/listar-lotes/listar-lotes.component';
import { DetalleLoteComponent } from './aviso-cobranza/detalle-lote/detalle-lote.component';
import { CargarLoteEmisionComponent } from './emision-masiva/cargar-lote/cargar-lote.component';
import { ListarLotesEmisionComponent } from './emision-masiva/listar-lotes/listar-lotes.component';
import { DetalleLoteEmisionComponent } from './emision-masiva/detalle-lote/detalle-lote.component';
import { CargarLoteVidaSaludComponent } from './vida-y-salud/cargar-lote/cargar-lote.component';
import { ListarLotesVidaSaludComponent } from './vida-y-salud/listar-lotes/listar-lotes.component';
import { DetalleLoteVidaSaludComponent } from './vida-y-salud/detalle-lote/detalle-lote.component';
import { ListarCompaniasVidaSaludComponent } from './vida-y-salud/mantenedor-companias/listar-companias.component';
import { CargarLoteCargaMasivaComponent } from './carga-masiva-generica/cargar-lote/cargar-lote.component';
import { ListarLotesCargaMasivaComponent } from './carga-masiva-generica/listar-lotes/listar-lotes.component';
import { DetalleLoteCargaMasivaComponent } from './carga-masiva-generica/detalle-lote/detalle-lote.component';
import { ColaActivaComponent } from './cola-ejecucion/cola-activa/cola-activa.component';
import { HistorialColaComponent } from './cola-ejecucion/historial-cola/historial-cola.component';
import { AdministracionComponent } from './administracion/administracion.component';
import { ListarNotificacionesComponent } from './notificaciones/listar-notificaciones/listar-notificaciones.component';
import { MiPerfilComponent } from './perfil/mi-perfil/mi-perfil.component';

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
    path: 'html/listar-doc-html/resultado-doc-html/actualizar-doc-html/:id',
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
    path: 'html/listar-doc-html/resultado-doc-html/:id',
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
    path: 'avisos-cobranza/listar-lotes/detalle-lote/:id',
    component: DetalleLoteComponent,
    data: {
      title: 'Detalle de Lote de Avisos de Cobranza'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'emision-masiva/cargar-lote',
    component: CargarLoteEmisionComponent,
    data: {
      title: 'Cargar Planilla de Emisión Masiva'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'emision-masiva/listar-lotes',
    component: ListarLotesEmisionComponent,
    data: {
      title: 'Lotes de Emisión Masiva'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'emision-masiva/listar-lotes/detalle-lote/:id',
    component: DetalleLoteEmisionComponent,
    data: {
      title: 'Detalle de Lote de Emisión Masiva'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'vida-y-salud/cargar-lote',
    component: CargarLoteVidaSaludComponent,
    data: {
      title: 'Cargar Planilla de Vida y Salud'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'vida-y-salud/listar-lotes',
    component: ListarLotesVidaSaludComponent,
    data: {
      title: 'Lotes de Vida y Salud'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'vida-y-salud/listar-lotes/detalle-lote/:id',
    component: DetalleLoteVidaSaludComponent,
    data: {
      title: 'Detalle de Lote de Vida y Salud'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'vida-y-salud/mantenedor-companias',
    component: ListarCompaniasVidaSaludComponent,
    data: {
      title: 'Mantenedor de Compañías de Vida y Salud'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'carga-masiva-generica/cargar-lote',
    component: CargarLoteCargaMasivaComponent,
    data: {
      title: 'Cargar Planilla de Carga Masiva Genérica'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'carga-masiva-generica/listar-lotes',
    component: ListarLotesCargaMasivaComponent,
    data: {
      title: 'Lotes de Carga Masiva Genérica'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'carga-masiva-generica/listar-lotes/detalle-lote/:id',
    component: DetalleLoteCargaMasivaComponent,
    data: {
      title: 'Detalle de Lote de Carga Masiva Genérica'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'cola-ejecucion/cola-activa',
    component: ColaActivaComponent,
    data: {
      title: 'Cola de Ejecución'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'cola-ejecucion/historial',
    component: HistorialColaComponent,
    data: {
      title: 'Historial de la Cola de Ejecución'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'notificaciones',
    component: ListarNotificacionesComponent,
    data: {
      title: 'Notificaciones'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'perfil',
    component: MiPerfilComponent,
    data: {
      title: 'Mi Perfil'
    },
    canActivate: [CertGuard]
  },
  {
    path: 'administracion',
    component: AdministracionComponent,
    data: {
      title: 'Administración'
    },
    canActivate: [CertGuard]
  },

];
