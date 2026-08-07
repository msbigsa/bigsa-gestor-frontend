import { EstadoDetalle } from './EstadoDetalle';
import { OrigenCorreo } from './OrigenCorreo';

export interface LoteDetalleResponse {
  detalleId: number;
  nroFila: number;
  nroPolizaRaw: string;

  nroEndosoRaw?: string;
  nroCuotasRaw?: string;
  fechaVenctoCuotaRaw?: string;
  rutContratanteRaw?: string;
  correoPlanillaRaw?: string;
  primaImpagaRaw?: string;
  codigoRamoRaw?: string;

  docuCodigo?: number;
  nroCuotas?: number;
  fechaVenctoCuota?: string;
  primaImpaga?: number;
  correoResuelto?: string;
  origenCorreo?: OrigenCorreo;

  estado: EstadoDetalle;
  registroError?: string;
}
