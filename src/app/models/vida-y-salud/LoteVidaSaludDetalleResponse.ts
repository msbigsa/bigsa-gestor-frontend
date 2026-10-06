import { EstadoDetalleVidaSalud } from './EstadoDetalleVidaSalud';
import { CorreoEstadoDetalle } from './CorreoEstadoDetalle';

// En fase 1 solo vienen completos los campos *Raw y el estado (PENDIENTE) -- el resto (resuelto por
// fase 2, y documento/correo de fase 3/4) viaja null hasta que esas fases corran.
export interface LoteVidaSaludDetalleResponse {
  detalleId: number;
  nroFila: number;

  tipoFacturaRaw?: string;
  nroPolizaRaw?: string;
  periodoRaw?: string;
  rutAseguradoRaw?: string;
  nroFacturaRaw?: string;
  fechaFacturaRaw?: string;
  codRamoRaw?: string;
  tipoCambioRaw?: string;
  primaNetaAfectaRaw?: string;
  primaNetaExentaRaw?: string;
  ivaRaw?: string;
  totalFacturaRaw?: string;
  itemAseguradoRaw?: string;

  docuCodigo?: number;
  nroPoliza?: string;
  digPoliza?: string;
  periodoAnio?: number;
  periodoMes?: number;
  rutAsegurado?: number;
  itemAseguradoNumero?: number;
  ramoCodigo?: number;
  primaNetaDocumento?: number;
  primaNetaPlanillaMo?: number;
  correoResuelto?: string;

  estado: EstadoDetalleVidaSalud;
  registroError?: string;

  cargaDocId?: number;
  nombreArchivoPdfResuelto?: string;

  fechaFacturacionReal?: string;
  correoEstado?: CorreoEstadoDetalle;
  correoError?: string;
}
