// Respuesta de POST /lotes/{id}/cancelar-ejecucion.
export interface CancelacionEjecucion {
  loteId: number;
  estado: 'CANCELADO' | 'CANCELACION_PEDIDA';
  mensaje: string;
}
