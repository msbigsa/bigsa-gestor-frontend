import { EstadoDetalleCarga } from './EstadoDetalleCarga';

// Solo lo comun a todos los tipos de carga; los datos propios de cada tipo aun no se exponen.
export interface LoteCargaDetalleResponse {
  detalleId: number;
  nroFila: number;
  grupo?: number;
  estado: EstadoDetalleCarga;
  registroError?: string;
}
