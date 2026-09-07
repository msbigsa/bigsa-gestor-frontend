import { EstadoLoteEmision } from './EstadoLoteEmision';

export interface LoteEmisionConfirmacion {
  loteId: number;
  loteOrigenId?: number;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  totalFilas: number;
  estadoLote: EstadoLoteEmision;
}
