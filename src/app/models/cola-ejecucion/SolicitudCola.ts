import { EstadoSolicitudCola } from './EstadoSolicitudCola';
import { UsuarioCola } from './UsuarioCola';

export interface SolicitudCola {
  idSolicitud: number;
  tipoTarea: string;
  tipoCarga: string;
  referenciaTipo: string;
  idCarga: number;
  descripcion: string;
  // Quien pidio la ejecucion (el dueno).
  usuario: UsuarioCola;
  estado: EstadoSolicitudCola;
  // Lugar en la cola de su grupo: solo en las PENDIENTE; null si esta en pausa.
  posicion?: number;
  // null si nunca se despacho; en una PENDIENTE, es un reintento en espera.
  intento?: number;
  fechaSolicitud: string;
  fechaInicio?: string;
  fechaFin?: string;
  resumen?: string;
  mensaje?: string;
  // false si su tipo de tarea esta apagado (espera en pausa).
  tipoActivo: boolean;
  // La pidio el usuario actual: solo esas se pueden cancelar.
  propia: boolean;
  cancelacionPedida: boolean;
}
