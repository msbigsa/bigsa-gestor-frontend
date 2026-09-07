import { EstadoDetalleEmision } from './EstadoDetalleEmision';
import { CorreoEstadoDetalle } from './CorreoEstadoDetalle';
import { TraspasoEstadoDetalle } from './TraspasoEstadoDetalle';

// En fase 1 solo vienen completos los campos *Raw y el estado (PENDIENTE) -- el resto (resuelto por
// fase 2, y emision/correo de fase 3/4) viaja null hasta que esas fases corran.
export interface LoteEmisionDetalleResponse {
  detalleId: number;
  nroFila: number;

  codigoBusquedaRaw?: string;
  nroPolizaRaw?: string;
  nroEndosoRaw?: string;
  fechaRecepcionRaw?: string;
  fechaEmisionRaw?: string;

  docuCodigo?: number;
  tipoDocumento?: string;
  nroPoliza?: string;
  digPoliza?: string;
  nroEndoso?: string;
  digEndoso?: string;
  fechaRecepcionCorredor?: string;
  fechaEmisionResuelta?: string;
  ciasCodigo?: number;
  negoCodigo?: number;
  ramoCodigo?: number;
  correoContratanteResuelto?: string;
  correoAseguradoResuelto?: string;
  correoFinalResuelto?: string;
  rutContratanteResuelto?: number;
  rutAseguradoResuelto?: number;

  estado: EstadoDetalleEmision;
  registroError?: string;

  cargaDocId?: number;
  nombreArchivoPdfResuelto?: string;
  pdfCorrelativoResueltoApi?: number;

  fechaEmisionReal?: string;
  correoEstado?: CorreoEstadoDetalle;
  correoError?: string;
  traspasoEstado?: TraspasoEstadoDetalle;
  traspasoError?: string;
}
