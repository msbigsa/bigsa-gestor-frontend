// PENDIENTE -> OK|ERROR|OMITIDO (fase 2). OMITIDO = fila que el SP decide no procesar sin ser un error.
export enum EstadoDetalleCarga {
  PENDIENTE = 'PENDIENTE',
  OK = 'OK',
  ERROR = 'ERROR',
  OMITIDO = 'OMITIDO',
}
