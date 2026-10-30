// Respuesta de POST /cola/{id}/cancelar.
export interface CancelacionSolicitud {
  estado: 'CANCELADA' | 'EN_EJECUCION';
  cancelacionPedida: boolean;
}
