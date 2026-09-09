import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { OpcionBusqueda } from 'src/app/models/emision-masiva/OpcionBusqueda';
import { CodDestinatario } from 'src/app/models/emision-masiva/CodDestinatario';
import { CodLlaveBusqueda } from 'src/app/models/emision-masiva/CodLlaveBusqueda';
import { EstadoDetalleEmision } from 'src/app/models/emision-masiva/EstadoDetalleEmision';
import { EstadoCargaDocumentos } from 'src/app/models/emision-masiva/EstadoCargaDocumentos';
import { UsuarioEmisionMasiva } from 'src/app/models/emision-masiva/UsuarioEmisionMasiva';

const ESTADO_LOTE_LABEL: Record<EstadoLoteEmision, string> = {
  [EstadoLoteEmision.CARGADO]: 'Cargado',
  [EstadoLoteEmision.VALIDANDO]: 'Validando...',
  [EstadoLoteEmision.VALIDADO_OK]: 'Validado OK',
  [EstadoLoteEmision.VALIDADO_CON_ERRORES]: 'Validado con errores',
  [EstadoLoteEmision.ERROR_VALIDACION]: 'Error de validación',
  [EstadoLoteEmision.PROCESANDO_DOCUMENTOS]: 'Procesando documentos...',
  [EstadoLoteEmision.EMITIENDO]: 'Emitiendo...',
  [EstadoLoteEmision.EMITIDO]: 'Emitido',
  [EstadoLoteEmision.EMITIDO_CON_ERRORES]: 'Emitido con errores',
  [EstadoLoteEmision.ERROR_EMISION]: 'Error de emisión',
  [EstadoLoteEmision.ELIMINADO]: 'Eliminado',
};

const ESTADO_LOTE_CLASE: Record<EstadoLoteEmision, string> = {
  [EstadoLoteEmision.CARGADO]: 'bg-light-info text-info',
  [EstadoLoteEmision.VALIDANDO]: 'bg-light-warning text-warning',
  [EstadoLoteEmision.VALIDADO_OK]: 'bg-light-success text-success',
  [EstadoLoteEmision.VALIDADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteEmision.ERROR_VALIDACION]: 'bg-light-error text-error',
  [EstadoLoteEmision.PROCESANDO_DOCUMENTOS]: 'bg-light-warning text-warning',
  [EstadoLoteEmision.EMITIENDO]: 'bg-light-warning text-warning',
  [EstadoLoteEmision.EMITIDO]: 'bg-light-success text-success',
  [EstadoLoteEmision.EMITIDO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteEmision.ERROR_EMISION]: 'bg-light-error text-error',
  [EstadoLoteEmision.ELIMINADO]: 'bg-light text-dark',
};

export function estadoLoteLabel(estado: EstadoLoteEmision): string {
  return ESTADO_LOTE_LABEL[estado] ?? estado;
}

export function estadoLoteClase(estado: EstadoLoteEmision): string {
  return ESTADO_LOTE_CLASE[estado] ?? 'bg-light-info text-info';
}

// Usa el contador de filas, no el estado del lote -- EMITIDO_CON_ERRORES tambien puede tener emitidas.
export function tieneFilasEmitidas(lote: LoteEmisionResponse): boolean {
  return (lote.totalFilasEmitidas ?? 0) > 0;
}

export const AVISO_ELIMINAR_FILAS_EMITIDAS =
  'Este lote tiene filas EMITIDAS: esa emisión no se revierte. Solo se elimina el registro en Gestor.';

// "codigo - nombre". Tambien acepta string crudo (CargaDocumentosResponse.usuarioCarga no se resuelve).
export function usuarioTexto(usuario: UsuarioEmisionMasiva | string | undefined): string {
  if (!usuario) {
    return '-';
  }
  if (typeof usuario === 'string') {
    return usuario;
  }

  return usuario.nombre ? `${usuario.codigo} - ${usuario.nombre}` : usuario.codigo;
}

// Para el hover del usuario; vacio si no aplica.
export function usuarioDescripcion(usuario: UsuarioEmisionMasiva | string | undefined): string {
  return usuario && typeof usuario !== 'string' ? (usuario.descripcion ?? '') : '';
}

function formatearFecha(fecha: string | undefined): string {
  return fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

// Info de auditoria (fecha + usuario) para el hover del badge de estado -- prioriza el evento
// mas reciente relevante al estado actual (eliminado > emitido > validado); vacio si no hay nada aun.
export function tooltipEstadoLote(lote: LoteEmisionResponse): string {
  if (lote.estadoLote === EstadoLoteEmision.ELIMINADO && lote.fechaEliminacion) {
    return `Eliminado el ${formatearFecha(lote.fechaEliminacion)} por ${usuarioTexto(lote.usuarioEliminacion)}`;
  }

  if (tieneErrorEmision(lote)) {
    return `Error al emitir: ${lote.mensajeErrorEmision}`;
  }

  if (lote.fechaEmision) {
    return `Emitido el ${formatearFecha(lote.fechaEmision)} por ${usuarioTexto(lote.usuarioEmision)}`;
  }

  if (lote.fechaValidacion) {
    return `Validado el ${formatearFecha(lote.fechaValidacion)} por ${usuarioTexto(lote.usuarioValidacion)}`;
  }

  return '';
}

// Para mostrar el motivo de forma visible (no solo en el hover) y evitar el error silencioso.
export function tieneErrorEmision(lote: LoteEmisionResponse): boolean {
  return lote.estadoLote === EstadoLoteEmision.ERROR_EMISION && !!lote.mensajeErrorEmision;
}

const OPCION_BUSQUEDA_LABEL: Record<OpcionBusqueda, string> = {
  [OpcionBusqueda.COTIZACION]: 'Cotización',
  [OpcionBusqueda.PROPUESTA]: 'Propuesta',
};

export function opcionBusquedaLabel(opcion: OpcionBusqueda): string {
  return OPCION_BUSQUEDA_LABEL[opcion] ?? opcion;
}

const COD_DESTINATARIO_LABEL: Record<CodDestinatario, string> = {
  [CodDestinatario.CONTRATANTE]: 'Contratante',
  [CodDestinatario.ASEGURADO]: 'Asegurado',
  [CodDestinatario.AMBOS]: 'Ambos',
};

export function codDestinatarioLabel(destinatario: CodDestinatario): string {
  return COD_DESTINATARIO_LABEL[destinatario] ?? destinatario;
}

const COD_LLAVE_BUSQUEDA_LABEL: Record<CodLlaveBusqueda, string> = {
  [CodLlaveBusqueda.POLIZA]: 'Número de póliza',
  [CodLlaveBusqueda.POLIZA_ENDOSO]: 'Póliza + endoso',
  [CodLlaveBusqueda.RUT_CONTRATANTE]: 'RUT del contratante',
  [CodLlaveBusqueda.POLIZA_RUT_CONTRATANTE]: 'Póliza + RUT del contratante',
  [CodLlaveBusqueda.RUT_ASEGURADO]: 'RUT del asegurado',
  [CodLlaveBusqueda.POLIZA_RUT_ASEGURADO]: 'Póliza + RUT del asegurado',
};

export function codLlaveBusquedaLabel(llave: CodLlaveBusqueda): string {
  return COD_LLAVE_BUSQUEDA_LABEL[llave] ?? llave;
}

// RUT_ASEGURADO/POLIZA_RUT_ASEGURADO solo tienen sentido si el destinatario incluye ASEGURADO.
export function llavesBusquedaDisponibles(destinatario: CodDestinatario | null): CodLlaveBusqueda[] {
  const incluyeAsegurado = destinatario === CodDestinatario.ASEGURADO || destinatario === CodDestinatario.AMBOS;

  return Object.values(CodLlaveBusqueda).filter(
    llave => incluyeAsegurado || !llave.includes('ASEGURADO'),
  );
}

const ESTADO_DETALLE_LABEL: Record<EstadoDetalleEmision, string> = {
  [EstadoDetalleEmision.PENDIENTE]: 'Pendiente',
  [EstadoDetalleEmision.OK]: 'OK',
  [EstadoDetalleEmision.ERROR]: 'Error',
  [EstadoDetalleEmision.EMITIDO]: 'Emitido',
  [EstadoDetalleEmision.SIN_DOCUMENTO]: 'Sin documento',
  [EstadoDetalleEmision.ERROR_EMISION]: 'Error de emisión',
};

const ESTADO_DETALLE_CLASE: Record<EstadoDetalleEmision, string> = {
  [EstadoDetalleEmision.PENDIENTE]: 'bg-light-info text-info',
  [EstadoDetalleEmision.OK]: 'bg-light-success text-success',
  [EstadoDetalleEmision.ERROR]: 'bg-light-error text-error',
  [EstadoDetalleEmision.EMITIDO]: 'bg-light-success text-success',
  [EstadoDetalleEmision.SIN_DOCUMENTO]: 'bg-light-warning text-warning',
  [EstadoDetalleEmision.ERROR_EMISION]: 'bg-light-error text-error',
};

export function estadoDetalleLabel(estado: EstadoDetalleEmision): string {
  return ESTADO_DETALLE_LABEL[estado] ?? estado;
}

export function estadoDetalleClase(estado: EstadoDetalleEmision): string {
  return ESTADO_DETALLE_CLASE[estado] ?? 'bg-light-info text-info';
}

// Replica el split que hace el SP de validacion (concatena motivos separados por "; ").
export function motivosError(registroError: string | undefined): string[] {
  if (!registroError) {
    return [];
  }

  return registroError.split(';').map(motivo => motivo.trim()).filter(motivo => motivo.length > 0);
}

// Texto corto para el hover del badge de estado: el motivo completo si es uno solo, o un resumen si son varios.
export function tooltipRegistroError(registroError: string | undefined): string {
  const motivos = motivosError(registroError);

  if (motivos.length === 0) {
    return '';
  }

  if (motivos.length === 1) {
    return motivos[0];
  }

  return `${motivos.length} errores`;
}

// "NNN-D": formato legible de poliza/endoso con su digito verificador, o "-" si no hay numero.
export function numeroConDigito(numero: string | undefined, digito: string | undefined): string {
  return numero ? `${numero}${digito ? '-' + digito : ''}` : '-';
}

const ESTADO_CARGA_DOC_LABEL: Record<EstadoCargaDocumentos, string> = {
  [EstadoCargaDocumentos.PROCESANDO]: 'Procesando...',
  [EstadoCargaDocumentos.COMPLETADO]: 'Completado',
  [EstadoCargaDocumentos.ERROR]: 'Error',
};

const ESTADO_CARGA_DOC_CLASE: Record<EstadoCargaDocumentos, string> = {
  [EstadoCargaDocumentos.PROCESANDO]: 'bg-light-warning text-warning',
  [EstadoCargaDocumentos.COMPLETADO]: 'bg-light-success text-success',
  [EstadoCargaDocumentos.ERROR]: 'bg-light-error text-error',
};

export function estadoCargaDocLabel(estado: EstadoCargaDocumentos): string {
  return ESTADO_CARGA_DOC_LABEL[estado] ?? estado;
}

export function estadoCargaDocClase(estado: EstadoCargaDocumentos): string {
  return ESTADO_CARGA_DOC_CLASE[estado] ?? 'bg-light-info text-info';
}
