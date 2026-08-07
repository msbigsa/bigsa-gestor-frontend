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
  [OrigenCorreo.SISTEMA]: 'info-circle',
  [OrigenCorreo.SIN_RESOLVER]: 'alert-triangle',
};

const ORIGEN_CORREO_CLASE: Record<OrigenCorreo, string> = {
  [OrigenCorreo.PLANILLA]: '',
  [OrigenCorreo.SISTEMA]: 'text-info',
  [OrigenCorreo.SIN_RESOLVER]: 'text-warning',
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

// La fecha llega ya formateada (pipe "date" del template) porque este archivo no tiene inyeccion de Angular.
export function tooltipEliminado(lote: LoteCargaResponse, fechaFormateada: string | null): string {
  if (lote.estadoLote !== EstadoLote.ELIMINADO) {
    return '';
  }

  const usuario = lote.usuarioEliminacion ? usuarioTexto(lote.usuarioEliminacion) : 'usuario desconocido';
  return `Eliminado el ${fechaFormateada ?? '-'} por ${usuario}`;
}

// totalFilasOk es historico (no se decrementa al enviar), asi que lo pendiente real de enviar
// es OK menos lo que ya se intento enviar (enviadas + fallidas).
export function filasPendientesDeEnviar(lote: LoteCargaResponse): number {
  return (lote.totalFilasOk ?? 0) - (lote.totalFilasEnviadas ?? 0) - (lote.totalFilasEnvioFallido ?? 0);
}
