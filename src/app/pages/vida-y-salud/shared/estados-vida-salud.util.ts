import { EstadoLoteVidaSalud } from 'src/app/models/vida-y-salud/EstadoLoteVidaSalud';
import { LoteVidaSaludResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludResponse';
import { AgrupacionCorreo } from 'src/app/models/vida-y-salud/AgrupacionCorreo';
import { UsuarioVidaSalud } from 'src/app/models/vida-y-salud/UsuarioVidaSalud';
import { EstadoDetalleVidaSalud } from 'src/app/models/vida-y-salud/EstadoDetalleVidaSalud';
import { EstadoCargaDocumentos } from 'src/app/models/vida-y-salud/EstadoCargaDocumentos';

const ESTADO_LOTE_LABEL: Record<EstadoLoteVidaSalud, string> = {
  [EstadoLoteVidaSalud.CARGADO]: 'Cargado',
  [EstadoLoteVidaSalud.VALIDANDO]: 'Validando...',
  [EstadoLoteVidaSalud.VALIDADO_OK]: 'Validado OK',
  [EstadoLoteVidaSalud.VALIDADO_CON_ERRORES]: 'Validado con errores',
  [EstadoLoteVidaSalud.ERROR_VALIDACION]: 'Error de validación',
  [EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS]: 'Procesando documentos...',
  [EstadoLoteVidaSalud.FACTURANDO]: 'Facturando...',
  [EstadoLoteVidaSalud.FACTURADO]: 'Facturado',
  [EstadoLoteVidaSalud.FACTURADO_CON_ERRORES]: 'Facturado con errores',
  [EstadoLoteVidaSalud.ERROR_FACTURACION]: 'Error de facturación',
  [EstadoLoteVidaSalud.ELIMINADO]: 'Eliminado',
};

const ESTADO_LOTE_CLASE: Record<EstadoLoteVidaSalud, string> = {
  [EstadoLoteVidaSalud.CARGADO]: 'bg-light-info text-info',
  [EstadoLoteVidaSalud.VALIDANDO]: 'bg-light-warning text-warning',
  [EstadoLoteVidaSalud.VALIDADO_OK]: 'bg-light-success text-success',
  [EstadoLoteVidaSalud.VALIDADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteVidaSalud.ERROR_VALIDACION]: 'bg-light-error text-error',
  [EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS]: 'bg-light-warning text-warning',
  [EstadoLoteVidaSalud.FACTURANDO]: 'bg-light-warning text-warning',
  [EstadoLoteVidaSalud.FACTURADO]: 'bg-light-success text-success',
  [EstadoLoteVidaSalud.FACTURADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteVidaSalud.ERROR_FACTURACION]: 'bg-light-error text-error',
  [EstadoLoteVidaSalud.ELIMINADO]: 'bg-light text-dark',
};

export function estadoLoteLabel(estado: EstadoLoteVidaSalud): string {
  return ESTADO_LOTE_LABEL[estado] ?? estado;
}

export function estadoLoteClase(estado: EstadoLoteVidaSalud): string {
  return ESTADO_LOTE_CLASE[estado] ?? 'bg-light-info text-info';
}

// "codigo - nombre". Tambien acepta string crudo (CargaDocumentosResponse.usuarioCarga no se resuelve).
export function usuarioTexto(usuario: UsuarioVidaSalud | string | undefined): string {
  if (!usuario) {
    return '-';
  }
  if (typeof usuario === 'string') {
    return usuario;
  }

  return usuario.nombre ? `${usuario.codigo} - ${usuario.nombre}` : usuario.codigo;
}

// Para el hover del usuario; vacio si no aplica.
export function usuarioDescripcion(usuario: UsuarioVidaSalud | string | undefined): string {
  return usuario && typeof usuario !== 'string' ? (usuario.descripcion ?? '') : '';
}

function formatearFecha(fecha: string | undefined): string {
  return fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

// Estados de lote que el backend puede acompañar de un mensajeError generico (una sola columna para
// cualquier fase -- ver LoteVidaSalud.mensajeError en el backend, el estado ya distingue cual).
// FACTURADO_CON_ERRORES lo trae si el correo no pudo salir (se retoma con "Reintentar").
const ESTADOS_CON_MENSAJE_ERROR: EstadoLoteVidaSalud[] = [
  EstadoLoteVidaSalud.ERROR_VALIDACION,
  EstadoLoteVidaSalud.ERROR_FACTURACION,
  EstadoLoteVidaSalud.FACTURADO_CON_ERRORES,
];

// Info de auditoria (fecha + usuario) para el hover del badge de estado -- prioriza el evento mas
// reciente (eliminado > facturado > validado). El error del lote se muestra aparte (banner / icono).
export function tooltipEstadoLote(lote: LoteVidaSaludResponse): string {
  if (lote.estadoLote === EstadoLoteVidaSalud.ELIMINADO && lote.fechaEliminacion) {
    return `Eliminado el ${formatearFecha(lote.fechaEliminacion)} por ${usuarioTexto(lote.usuarioEliminacion)}`;
  }

  if (lote.fechaFacturacion) {
    return `Facturado el ${formatearFecha(lote.fechaFacturacion)} por ${usuarioTexto(lote.usuarioFacturacion)}`;
  }

  if (lote.fechaValidacion) {
    return `Validado el ${formatearFecha(lote.fechaValidacion)} por ${usuarioTexto(lote.usuarioValidacion)}`;
  }

  return '';
}

// Para mostrar el motivo de forma visible (no solo en el hover) y evitar el error silencioso.
// Cubre cualquier estado del lote que pueda traer mensaje (validacion, facturacion o correo), no solo uno.
export function tieneErrorLote(lote: LoteVidaSaludResponse): boolean {
  return ESTADOS_CON_MENSAJE_ERROR.includes(lote.estadoLote) && !!lote.mensajeError;
}

// Usa el contador de filas, no el estado del lote -- FACTURADO_CON_ERRORES tambien puede tener facturadas.
export function tieneFilasFacturadas(lote: LoteVidaSaludResponse): boolean {
  return (lote.totalFilasFacturadas ?? 0) > 0;
}

export const AVISO_ELIMINAR_FILAS_FACTURADAS =
  'Este lote tiene filas FACTURADAS: esa facturación no se revierte. Solo se elimina el registro en Gestor.';

const AGRUPACION_CORREO_LABEL: Record<AgrupacionCorreo, string> = {
  [AgrupacionCorreo.POR_CORREO]: 'Por correo',
  [AgrupacionCorreo.POR_ASEGURADO]: 'Por asegurado',
};

export function agrupacionCorreoLabel(agrupacion: AgrupacionCorreo): string {
  return AGRUPACION_CORREO_LABEL[agrupacion] ?? agrupacion;
}

const ESTADO_DETALLE_LABEL: Record<EstadoDetalleVidaSalud, string> = {
  [EstadoDetalleVidaSalud.PENDIENTE]: 'Pendiente',
  [EstadoDetalleVidaSalud.OK]: 'OK',
  [EstadoDetalleVidaSalud.ERROR]: 'Error',
  [EstadoDetalleVidaSalud.FACTURADO]: 'Facturado',
  [EstadoDetalleVidaSalud.SIN_DOCUMENTO]: 'Sin documento',
  [EstadoDetalleVidaSalud.ERROR_FACTURACION]: 'Error de facturación',
};

const ESTADO_DETALLE_CLASE: Record<EstadoDetalleVidaSalud, string> = {
  [EstadoDetalleVidaSalud.PENDIENTE]: 'bg-light-info text-info',
  [EstadoDetalleVidaSalud.OK]: 'bg-light-success text-success',
  [EstadoDetalleVidaSalud.ERROR]: 'bg-light-error text-error',
  [EstadoDetalleVidaSalud.FACTURADO]: 'bg-light-success text-success',
  [EstadoDetalleVidaSalud.SIN_DOCUMENTO]: 'bg-light-warning text-warning',
  [EstadoDetalleVidaSalud.ERROR_FACTURACION]: 'bg-light-error text-error',
};

export function estadoDetalleLabel(estado: EstadoDetalleVidaSalud): string {
  return ESTADO_DETALLE_LABEL[estado] ?? estado;
}

export function estadoDetalleClase(estado: EstadoDetalleVidaSalud): string {
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

// "NNN-D": formato legible de poliza con su digito verificador, o "-" si no hay numero.
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
