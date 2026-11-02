import { EstadoDetalleCarga } from './EstadoDetalleCarga';

// Lo comun a todos los tipos de carga y lo minimo para ubicar la fila; los datos propios de cada tipo aun no se exponen.
export interface LoteCargaDetalleResponse {
  detalleId: number;
  nroFila: number;
  // Interno de la ejecucion; no se muestra.
  grupo?: number;
  // Como vino en la planilla.
  poliza?: string;
  // Propuesta BIGSA.
  docuCodigo?: number;
  item?: string;
  ciasCodigo?: number;
  // Solo en los tipos que trabajan con endosos.
  endoso?: string;
  estado: EstadoDetalleCarga;
  registroError?: string;
}
