import { EstadoLoteVidaSalud } from './EstadoLoteVidaSalud';

export interface LoteVidaSaludConfirmacion {
  loteId: number;
  loteOrigenId?: number;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  totalFilas: number;
  estadoLote: EstadoLoteVidaSalud;
}
