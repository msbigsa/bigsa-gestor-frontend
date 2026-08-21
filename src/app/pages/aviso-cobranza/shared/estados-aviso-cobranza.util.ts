import { EstadoLote } from 'src/app/models/aviso-cobranza/EstadoLote';
import { EstadoDetalle } from 'src/app/models/aviso-cobranza/EstadoDetalle';
import { OrigenCorreo } from 'src/app/models/aviso-cobranza/OrigenCorreo';
import { LoteCargaResponse } from 'src/app/models/aviso-cobranza/LoteCargaResponse';
import { UsuarioAvisoCobranza } from 'src/app/models/aviso-cobranza/UsuarioAvisoCobranza';

const ESTADO_LOTE_LABEL: Record<EstadoLote, string> = {
  [EstadoLote.CARGADO]: 'Cargado',
  [EstadoLote.VALIDANDO]: 'Validando...',
  [EstadoLote.VALIDADO_OK]: 'Validado OK',
  [EstadoLote.VALIDADO_CON_ERRORES]: 'Validado con errores',
  [EstadoLote.ERROR_VALIDACION]: 'Error de validación',
  [EstadoLote.ENVIANDO]: 'Enviando...',
  [EstadoLote.ENVIADO]: 'Enviado',
  [EstadoLote.ENVIADO_CON_ERRORES]: 'Enviado con errores',
  [EstadoLote.ERROR_ENVIO]: 'Error de envío',
  [EstadoLote.ELIMINADO]: 'Eliminado',
};

const ESTADO_LOTE_CLASE: Record<EstadoLote, string> = {
  [EstadoLote.CARGADO]: 'bg-light-info text-info',
  [EstadoLote.VALIDANDO]: 'bg-light-warning text-warning',
  [EstadoLote.VALIDADO_OK]: 'bg-light-success text-success',
  [EstadoLote.VALIDADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLote.ERROR_VALIDACION]: 'bg-light-error text-error',
  [EstadoLote.ENVIANDO]: 'bg-light-warning text-warning',
  [EstadoLote.ENVIADO]: 'bg-light-success text-success',
  [EstadoLote.ENVIADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLote.ERROR_ENVIO]: 'bg-light-error text-error',
  [EstadoLote.ELIMINADO]: 'bg-light text-dark',
};

const ESTADO_DETALLE_LABEL: Record<EstadoDetalle, string> = {
  [EstadoDetalle.PENDIENTE]: 'Pendiente',
  [EstadoDetalle.OK]: 'OK',
  [EstadoDetalle.ERROR]: 'Error',
  [EstadoDetalle.OMITIDO]: 'Omitido',
  [EstadoDetalle.ENVIADO]: 'Enviado',
  [EstadoDetalle.ENVIO_FALLIDO]: 'Envío fallido',
};

const ESTADO_DETALLE_CLASE: Record<EstadoDetalle, string> = {
  [EstadoDetalle.PENDIENTE]: 'bg-light-info text-info',
  [EstadoDetalle.OK]: 'bg-light-success text-success',
  [EstadoDetalle.ERROR]: 'bg-light-error text-error',
  [EstadoDetalle.OMITIDO]: 'bg-light text-dark',
  [EstadoDetalle.ENVIADO]: 'bg-light-success text-success',
  [EstadoDetalle.ENVIO_FALLIDO]: 'bg-light-error text-error',
};

export function estadoLoteLabel(estado: EstadoLote): string {
  return ESTADO_LOTE_LABEL[estado] ?? estado;
}

export function estadoLoteClase(estado: EstadoLote): string {
  return ESTADO_LOTE_CLASE[estado] ?? 'bg-light-info text-info';
}

export function estadoDetalleLabel(estado: EstadoDetalle): string {
  return ESTADO_DETALLE_LABEL[estado] ?? estado;
}

export function estadoDetalleClase(estado: EstadoDetalle): string {
  return ESTADO_DETALLE_CLASE[estado] ?? 'bg-light-info text-info';
}

const ORIGEN_CORREO_TOOLTIP: Record<OrigenCorreo, string> = {
  [OrigenCorreo.PLANILLA]: 'El correo vino informado en la planilla.',
  [OrigenCorreo.SISTEMA]: 'No venía en la planilla; se usó el correo del cliente registrado en el sistema.',
  [OrigenCorreo.SIN_RESOLVER]: 'No se encontró correo del cliente; se enviará al correo del ejecutivo asociado.',
};

const ORIGEN_CORREO_ICONO: Record<OrigenCorreo, string | null> = {
  [OrigenCorreo.PLANILLA]: null,
  [OrigenCorreo.SISTEMA]: 'info',
  [OrigenCorreo.SIN_RESOLVER]: 'warning',
};

const ORIGEN_CORREO_CLASE: Record<OrigenCorreo, string> = {
  [OrigenCorreo.PLANILLA]: '',
  [OrigenCorreo.SISTEMA]: 'text-info!',
  [OrigenCorreo.SIN_RESOLVER]: 'text-warning!',
};

export function origenCorreoTooltip(origen: OrigenCorreo | undefined): string {
  return origen ? (ORIGEN_CORREO_TOOLTIP[origen] ?? '') : '';
}

export function origenCorreoIcono(origen: OrigenCorreo | undefined): string | null {
  return origen ? ORIGEN_CORREO_ICONO[origen] : null;
}

export function origenCorreoClase(origen: OrigenCorreo | undefined): string {
  return origen ? (ORIGEN_CORREO_CLASE[origen] ?? '') : '';
}

// "codigo - nombre": mas facil de ubicar para quienes se guian por el codigo.
export function usuarioTexto(usuario: UsuarioAvisoCobranza | undefined): string {
  if (!usuario) {
    return '-';
  }

  return usuario.nombre ? `${usuario.codigo} - ${usuario.nombre}` : usuario.codigo;
}

function usuarioOTexto(usuario: UsuarioAvisoCobranza | undefined): string {
  return usuario ? usuarioTexto(usuario) : 'usuario desconocido';
}

// Formato propio (sin DatePipe, este archivo no tiene inyeccion de Angular) pero equivalente al "short" usado en el resto del modulo.
function formatearFecha(fecha: string | undefined): string {
  return fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

// Info de auditoria (fecha + usuario) para el hover del badge de estado -- prioriza el evento
// mas reciente relevante al estado actual (eliminado > error de envio > enviado > validado); vacio si no hay nada aun.
export function tooltipEstadoLote(lote: LoteCargaResponse): string {
  if (lote.estadoLote === EstadoLote.ELIMINADO && lote.fechaEliminacion) {
    return `Eliminado el ${formatearFecha(lote.fechaEliminacion)} por ${usuarioOTexto(lote.usuarioEliminacion)}`;
  }

  if (tieneErrorEnvio(lote)) {
    return `Error al enviar: ${lote.mensajeErrorEnvio}`;
  }

  if (lote.fechaEnvio) {
    return `Enviado el ${formatearFecha(lote.fechaEnvio)} por ${usuarioOTexto(lote.usuarioEnvio)}`;
  }

  if (lote.fechaValidacion) {
    return `Validado el ${formatearFecha(lote.fechaValidacion)} por ${usuarioOTexto(lote.usuarioValidacion)}`;
  }

  return '';
}

// Para mostrar el motivo de forma visible (no solo en el hover) y evitar el error silencioso.
export function tieneErrorEnvio(lote: LoteCargaResponse): boolean {
  return lote.estadoLote === EstadoLote.ERROR_ENVIO && !!lote.mensajeErrorEnvio;
}

// Replica el split que hace el backend (LoteLogServiceImpl.dividirMotivos) para poder listar los motivos por separado.
export function motivosError(registroError: string | undefined): string[] {
  if (!registroError) {
    return [];
  }

  return registroError.split(';').map(motivo => motivo.trim()).filter(motivo => motivo.length > 0);
}

// Texto corto para el hover del badge de estado: el motivo completo si es uno solo, o un resumen si son varios
// (la lista completa se ve en el dialog que abre el click sobre el badge).
export function tooltipRegistroError(registroError: string | undefined): string {
  const motivos = motivosError(registroError);

  if (motivos.length === 0) {
    return '';
  }

  if (motivos.length === 1) {
    return motivos[0];
  }

  return `${motivos.length} errores - clic para ver detalle`;
}

// totalFilasOk es historico (no se decrementa al enviar). Las filas en ENVIO_FALLIDO no se restan:
// el backend las vuelve a OK automaticamente en cada (re)envio (iniciarEnvio -> reiniciarFilasEnvioFallido),
// asi que siguen siendo "pendientes" -- solo lo enviado con exito ya no cuenta.
export function filasPendientesDeEnviar(lote: LoteCargaResponse): number {
  return (lote.totalFilasOk ?? 0) - (lote.totalFilasEnviadas ?? 0);
}
