import { EstadoLoteEmision } from './EstadoLoteEmision';
import { OpcionBusqueda } from './OpcionBusqueda';
import { CodDestinatario } from './CodDestinatario';
import { CodLlaveBusqueda } from './CodLlaveBusqueda';
import { UsuarioEmisionMasiva } from './UsuarioEmisionMasiva';

export interface LoteEmisionResponse {
  loteId: number;
  loteOrigenId?: number;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  usuarioCarga?: UsuarioEmisionMasiva;

  opcionBusqueda: OpcionBusqueda;
  enviaCorreo: boolean;
  codDestinatario?: CodDestinatario;
  codLlaveBusqueda?: CodLlaveBusqueda;
  codFormato?: number;

  totalFilas: number;
  totalFilasOk?: number;
  totalFilasError?: number;
  estadoLote: EstadoLoteEmision;
  fechaValidacion?: string;
  usuarioValidacion?: UsuarioEmisionMasiva;

  totalFilasEmitidas?: number;
  totalFilasSinDocumento?: number;
  totalFilasErrorEmision?: number;
  totalCorreosEnviados?: number;
  totalCorreosFallidos?: number;
  fechaEmision?: string;
  usuarioEmision?: UsuarioEmisionMasiva;
  mensajeErrorEmision?: string;

  fechaEliminacion?: string;
  usuarioEliminacion?: UsuarioEmisionMasiva;
}
