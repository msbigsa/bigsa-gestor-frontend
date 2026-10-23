// PENDIENTE -> OK|ERROR|OMITIDO (fase 2). OMITIDO = fila que el SP decide no procesar sin ser un error.
// Ejecucion: OK -> EJECUTADO|ERROR_EJECUCION.
export enum EstadoDetalleCarga {
  PENDIENTE = 'PENDIENTE',
  OK = 'OK',
  ERROR = 'ERROR',
  OMITIDO = 'OMITIDO',
  EJECUTADO = 'EJECUTADO',
  ERROR_EJECUCION = 'ERROR_EJECUCION',
}
