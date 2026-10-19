import { EstadoLoteCarga } from './EstadoLoteCarga';
import { LayoutPlanilla } from './LayoutPlanilla';
import { TipoCarga } from './TipoCarga';

export interface LoteCargaConfirmacion {
  loteId: number;
  loteOrigenId?: number;
  tipoCarga: TipoCarga;
  layout: LayoutPlanilla;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  totalFilas: number;
  estadoLote: EstadoLoteCarga;
}
