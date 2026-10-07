import { EstadoLote } from './EstadoLote';
import { UsuarioAvisoCobranza } from './UsuarioAvisoCobranza';

export interface LoteCargaResponse {
  loteId: number;
  loteOrigenId?: number;
  ciasCodigo?: number;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  usuarioCarga?: UsuarioAvisoCobranza;
  totalFilas: number;
  estadoLote: EstadoLote;
  // Generico para el lote completo, cualquier fase -- estadoLote ya distingue cual
  mensajeError?: string;

  totalFilasOk?: number;
  totalFilasError?: number;
  totalFilasOmitidas?: number;
  fechaValidacion?: string;
  usuarioValidacion?: UsuarioAvisoCobranza;

  totalFilasEnviadas?: number;
  totalFilasEnvioFallido?: number;
  fechaEnvio?: string;
  usuarioEnvio?: UsuarioAvisoCobranza;

  fechaEliminacion?: string;
  usuarioEliminacion?: UsuarioAvisoCobranza;
}
