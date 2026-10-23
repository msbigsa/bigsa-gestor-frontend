// Respuesta de POST /lotes/{id}/ejecutar.
export interface EjecucionEncolada {
  loteId: number;
  idSolicitud: string;
  posicionCola?: number;
}
