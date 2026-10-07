import { EstadoLoteEmision } from './EstadoLoteEmision';
import { OpcionBusqueda } from './OpcionBusqueda';
import { CodDestinatario } from './CodDestinatario';
import { CodLlaveBusqueda } from './CodLlaveBusqueda';
import { UsuarioEmisionMasiva } from './UsuarioEmisionMasiva';
import { FormatoArchivo } from './FormatoArchivo';

export interface LoteEmisionResponse {
  loteId: number;
  loteOrigenId?: number;
  nombreArchivoOrigen: string;
  formatoArchivo: FormatoArchivo;
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
  // Generico para el lote completo, cualquier fase -- estadoLote ya distingue cual
  mensajeError?: string;
  fechaValidacion?: string;
  usuarioValidacion?: UsuarioEmisionMasiva;

  totalFilasEmitidas?: number;
  totalFilasSinDocumento?: number;
  totalFilasErrorEmision?: number;
  totalCorreosEnviados?: number;
  totalCorreosFallidos?: number;
  fechaEmision?: string;
  usuarioEmision?: UsuarioEmisionMasiva;

  fechaEliminacion?: string;
  usuarioEliminacion?: UsuarioEmisionMasiva;
}
