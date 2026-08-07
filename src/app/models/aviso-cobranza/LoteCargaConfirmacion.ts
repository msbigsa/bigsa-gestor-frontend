import { EstadoLote } from './EstadoLote';

export interface LoteCargaConfirmacion {
  loteId: number;
  loteOrigenId?: number;
  ciasCodigo?: number;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  totalFilas: number;
  estadoLote: EstadoLote;
}
