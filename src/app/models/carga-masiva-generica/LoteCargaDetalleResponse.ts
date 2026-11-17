import { EstadoDetalleCarga } from './EstadoDetalleCarga';
import { EstadoPagoExistente } from './EstadoPagoExistente';

// Lo comun a todos los tipos de carga y lo minimo para ubicar la fila; los datos propios de cada tipo no se exponen.
export interface LoteCargaDetalleResponse {
  detalleId: number;
  nroFila: number;
  // Interno de la ejecucion; no se muestra.
  grupo?: number;
  // Como vino en la planilla.
  poliza?: string;
  // Propuesta BIGSA; en las cargas que crean un documento, la del documento creado.
  docuCodigo?: number;
  item?: string;
  ciasCodigo?: number;
  negoCodigo?: number;
  ramoCodigo?: number;
  // Solo en los tipos que trabajan con endosos.
  endoso?: string;
  estado: EstadoDetalleCarga;
  registroError?: string;
  // Documento existente que la ejecucion paga en una fila rechazada.
  pagoExistenteDocuCodigo?: number;
  // Sin valor: aun no se intenta.
  pagoExistenteEstado?: EstadoPagoExistente;
  // Motivo si no se pago.
  pagoExistenteMensaje?: string;
}
