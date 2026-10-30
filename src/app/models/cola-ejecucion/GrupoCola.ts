import { SolicitudCola } from './SolicitudCola';

// Un grupo de concurrencia: lo que se ejecuta y lo que espera, en orden de salida.
export interface GrupoCola {
  grupo: string;
  descripcion: string;
  enEjecucion?: SolicitudCola;
  pendientes: SolicitudCola[];
}
