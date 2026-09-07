import { EstadoLoteEmision } from './EstadoLoteEmision';
import { OpcionBusqueda } from './OpcionBusqueda';
import { CodDestinatario } from './CodDestinatario';
import { CodLlaveBusqueda } from './CodLlaveBusqueda';

// A diferencia de avisos-cobranza, este backend no resuelve el usuario contra GLO_USUARIOS:
// los campos usuario* llegan como el codigo crudo del JWT (string), no un objeto.
export interface LoteEmisionResponse {
  loteId: number;
  loteOrigenId?: number;
  nombreArchivoOrigen: string;
  fechaCarga: string;
  usuarioCarga?: string;

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
  usuarioValidacion?: string;

  totalFilasEmitidas?: number;
  totalFilasSinDocumento?: number;
  totalFilasErrorEmision?: number;
  totalCorreosEnviados?: number;
  totalCorreosFallidos?: number;
  fechaEmision?: string;
  usuarioEmision?: string;
  mensajeErrorEmision?: string;

  fechaEliminacion?: string;
  usuarioEliminacion?: string;
}
