import { EstadoSolicitudCola } from 'src/app/models/cola-ejecucion/EstadoSolicitudCola';
import { GrupoCola } from 'src/app/models/cola-ejecucion/GrupoCola';
import { SolicitudCola } from 'src/app/models/cola-ejecucion/SolicitudCola';
import { UsuarioCola } from 'src/app/models/cola-ejecucion/UsuarioCola';
import { ConfirmDialogData } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';

export const RUTA_COLA_ACTIVA = '/inicio/cola-ejecucion/cola-activa';

// Pantalla de detalle de cada modulo que encola, y la ruta del menu que da acceso a ella.
interface DestinoCarga {
  rutaDetalle: string;
  rutaPermiso: string;
}

const DESTINOS_CARGA: Record<string, DestinoCarga> = {
  'CMG|LOTE': {
    rutaDetalle: '/inicio/carga-masiva-generica/listar-lotes/detalle-lote',
    rutaPermiso: '/inicio/carga-masiva-generica/listar-lotes',
  },
};

export function destinoCarga(solicitud: SolicitudCola): DestinoCarga | undefined {
  return DESTINOS_CARGA[`${solicitud.tipoCarga}|${solicitud.referenciaTipo}`];
}

// "LOTE 123" para CMG; si el tipo no se conoce, lo que venga.
export function referenciaTexto(solicitud: SolicitudCola): string {
  return solicitud.referenciaTipo === 'LOTE' ? `Lote #${solicitud.idCarga}` : `${solicitud.referenciaTipo} ${solicitud.idCarga}`;
}

// Se cayo y la cola la retoma sola: sale primera y no se mueve.
export function esReintento(solicitud: SolicitudCola): boolean {
  return solicitud.estado === EstadoSolicitudCola.PENDIENTE && solicitud.intento != null;
}

// Su tipo esta apagado: no se mueve ni sale hasta reactivarlo.
export function enPausa(solicitud: SolicitudCola): boolean {
  return solicitud.estado === EstadoSolicitudCola.PENDIENTE && (!solicitud.tipoActivo || solicitud.posicion == null);
}

// Rango para mover: detras de los reintentos, sin las en pausa.
export function rangoPosiciones(grupo: GrupoCola): { min: number; max: number } {
  const numeradas = grupo.pendientes.filter(p => p.posicion != null);

  return {
    min: numeradas.filter(p => esReintento(p)).length + 1,
    max: numeradas.length,
  };
}

// Por que no se puede mover; vacio si se puede.
export function motivoNoMovible(solicitud: SolicitudCola): string {
  if (esReintento(solicitud)) {
    return 'Es un reintento: sale primera y no se puede mover';
  }

  if (enPausa(solicitud)) {
    return 'Está en pausa: su tipo de tarea está desactivado';
  }

  return '';
}

export function puedeCancelar(solicitud: SolicitudCola): boolean {
  return solicitud.propia && !solicitud.cancelacionPedida;
}

// En la cola sale al instante; ya empezada, termina la fila en curso.
export function dialogoCancelacion(solicitud: SolicitudCola): ConfirmDialogData {
  const enCola = solicitud.estado === EstadoSolicitudCola.PENDIENTE && !esReintento(solicitud);

  return {
    title: 'Cancelar ejecución',
    message: enCola
      ? `¿Cancelar "${solicitud.descripcion}"? Sale de la cola al instante.`
      : `¿Cancelar "${solicitud.descripcion}"? Ya empezó: se detiene después de la fila en curso y cierra lo que `
        + 'alcanzó a modificar.',
    confirmText: 'Cancelar ejecución',
    cancelText: 'Volver',
    type: 'danger',
  };
}

const ESTADO_LABEL: Record<EstadoSolicitudCola, string> = {
  [EstadoSolicitudCola.PENDIENTE]: 'En espera',
  [EstadoSolicitudCola.EN_EJECUCION]: 'En ejecución',
  [EstadoSolicitudCola.FINALIZADA]: 'Finalizada',
  [EstadoSolicitudCola.ERROR]: 'Error',
  [EstadoSolicitudCola.CANCELADA]: 'Cancelada',
  [EstadoSolicitudCola.ABORTADA]: 'Abortada',
};

const ESTADO_CLASE: Record<EstadoSolicitudCola, string> = {
  [EstadoSolicitudCola.PENDIENTE]: 'bg-light-info text-info',
  [EstadoSolicitudCola.EN_EJECUCION]: 'bg-light-warning text-warning',
  [EstadoSolicitudCola.FINALIZADA]: 'bg-light-success text-success',
  [EstadoSolicitudCola.ERROR]: 'bg-light-error text-error',
  [EstadoSolicitudCola.CANCELADA]: 'bg-light-secondary text-secondary',
  [EstadoSolicitudCola.ABORTADA]: 'bg-light-error text-error',
};

export function estadoSolicitudLabel(estado: EstadoSolicitudCola): string {
  return ESTADO_LABEL[estado] ?? estado;
}

export function estadoSolicitudClase(estado: EstadoSolicitudCola): string {
  return ESTADO_CLASE[estado] ?? 'bg-light-info text-info';
}

// Hover del estado de una terminada: el motivo de la falla, o por que se cancelo.
export function tooltipEstadoSolicitud(solicitud: SolicitudCola): string {
  if (solicitud.estado === EstadoSolicitudCola.ABORTADA) {
    return solicitud.mensaje ? `Se reintentó y no se pudo: ${solicitud.mensaje}` : 'Se reintentó y no se pudo';
  }

  return solicitud.mensaje ?? '';
}

// "codigo - nombre".
export function usuarioTexto(usuario: UsuarioCola | undefined): string {
  if (!usuario) {
    return '-';
  }

  return usuario.nombre ? `${usuario.codigo} - ${usuario.nombre}` : usuario.codigo;
}

// Para el hover del usuario; vacio si no aplica.
export function usuarioDescripcion(usuario: UsuarioCola | undefined): string {
  return usuario?.descripcion ?? '';
}
