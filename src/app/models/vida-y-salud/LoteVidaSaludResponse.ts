import { EstadoLoteVidaSalud } from './EstadoLoteVidaSalud';
import { FormatoArchivo } from './FormatoArchivo';
import { AgrupacionCorreo } from './AgrupacionCorreo';
import { UsuarioVidaSalud } from './UsuarioVidaSalud';

export interface LoteVidaSaludResponse {
  loteId: number;
  loteOrigenId?: number;
  nombreArchivoOrigen: string;
  formatoArchivo: FormatoArchivo;
  fechaCarga: string;
  usuarioCarga?: UsuarioVidaSalud;

  ciasCodigo: number;
  incluyePdf: boolean;
  enviaCorreo: boolean;
  agrupacionCorreo?: AgrupacionCorreo;
  codFormato?: number;

  totalFilas: number;
  totalFilasOk?: number;
  totalFilasError?: number;
  estadoLote: EstadoLoteVidaSalud;
  // Generico para el lote completo, cualquier fase -- estadoLote ya distingue cual
  // (ERROR_VALIDACION/ERROR_FACTURACION/etc.), no hay una columna de mensaje por fase.
  mensajeError?: string;
  fechaValidacion?: string;
  usuarioValidacion?: UsuarioVidaSalud;

  totalFilasFacturadas?: number;
  totalFilasSinDocumento?: number;
  totalFilasErrorFacturacion?: number;
  totalCorreosEnviados?: number;
  totalCorreosFallidos?: number;
  fechaFacturacion?: string;
  usuarioFacturacion?: UsuarioVidaSalud;

  fechaEliminacion?: string;
  usuarioEliminacion?: UsuarioVidaSalud;
}
