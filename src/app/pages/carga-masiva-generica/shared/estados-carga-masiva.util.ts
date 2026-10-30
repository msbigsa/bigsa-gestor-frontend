import { EstadoLoteCarga } from 'src/app/models/carga-masiva-generica/EstadoLoteCarga';
import { EstadoDetalleCarga } from 'src/app/models/carga-masiva-generica/EstadoDetalleCarga';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { UsuarioCargaMasiva } from 'src/app/models/carga-masiva-generica/UsuarioCargaMasiva';
import { LayoutPlanilla } from 'src/app/models/carga-masiva-generica/LayoutPlanilla';
import { FechaPropuestaOrigen } from 'src/app/models/carga-masiva-generica/FechaPropuestaOrigen';
import { FechasEmisionOrigen } from 'src/app/models/carga-masiva-generica/FechasEmisionOrigen';
import { ConfirmDialogData } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';

// Coincide con EstadoLoteCarga.INTERMEDIOS del backend.
export const ESTADOS_EN_PROCESO: EstadoLoteCarga[] = [
  EstadoLoteCarga.VALIDANDO,
  EstadoLoteCarga.EN_COLA,
  EstadoLoteCarga.EJECUTANDO,
];

// Coincide con EstadoLoteCarga.EJECUTABLES del backend: validado, o reintento de lo que quedo pendiente.
export const ESTADOS_EJECUTABLES: EstadoLoteCarga[] = [
  EstadoLoteCarga.VALIDADO_OK,
  EstadoLoteCarga.VALIDADO_CON_ERRORES,
  EstadoLoteCarga.EJECUTADO_CON_ERRORES,
  EstadoLoteCarga.ERROR_EJECUCION,
  EstadoLoteCarga.CANCELADO,
];

// Estado transitorio o ejecucion en curso (durante la revalidacion el lote pasa un instante por VALIDADO_*).
export function loteEnProceso(lote: LoteCargaResponse | null | undefined): boolean {
  return !!lote && (ESTADOS_EN_PROCESO.includes(lote.estadoLote) || lote.ejecucionActiva);
}

export function puedeEjecutarLote(lote: LoteCargaResponse | null | undefined): boolean {
  return !!lote && !lote.ejecucionActiva && ESTADOS_EJECUTABLES.includes(lote.estadoLote);
}

// Solo quien la pidio y si no esta ya pedida, como exige el backend.
export function puedeCancelarEjecucion(lote: LoteCargaResponse | null | undefined, codigoUsuario: string | number | undefined): boolean {
  return !!lote && lote.ejecucionActiva && !lote.cancelacionPedida && esUsuario(lote.usuarioEjecucion, codigoUsuario);
}

// Mismo criterio que el backend: sin distinguir mayusculas ni espacios.
export function esUsuario(usuario: UsuarioCargaMasiva | undefined, codigoUsuario: string | number | undefined): boolean {
  const codigo = String(codigoUsuario ?? '').trim().toLowerCase();
  return codigo !== '' && (usuario?.codigo ?? '').trim().toLowerCase() === codigo;
}

// Retoma lo que no se cargo, sin repetir lo ya ejecutado.
export function esReintentoEjecucion(estado: EstadoLoteCarga | undefined): boolean {
  return estado === EstadoLoteCarga.EJECUTADO_CON_ERRORES
    || estado === EstadoLoteCarga.ERROR_EJECUCION
    || estado === EstadoLoteCarga.CANCELADO;
}

export function accionEjecutarLabel(estado: EstadoLoteCarga | undefined): string {
  if (estado === EstadoLoteCarga.CANCELADO) {
    return 'Retomar ejecución';
  }

  return esReintentoEjecucion(estado) ? 'Reintentar ejecución' : 'Ejecutar carga';
}

// Datos del ConfirmDialog de ejecutar, comunes al listado y al detalle.
export function dialogoEjecucion(lote: LoteCargaResponse): ConfirmDialogData {
  const reintento = esReintentoEjecucion(lote.estadoLote);
  const retoma = lote.estadoLote === EstadoLoteCarga.CANCELADO;

  return {
    title: accionEjecutarLabel(lote.estadoLote),
    message: reintento
      ? `¿${retoma ? 'Retomar' : 'Reintentar'} la ejecución del lote #${lote.loteId}? El lote pasa a la cola de `
        + 'ejecución; al ejecutarse sigue con lo que no se cargó, sin repetir las filas ya cargadas.'
      : `¿Ejecutar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? El lote pasa a la cola de ejecución y se `
        + 'vuelve a validar al ejecutarse.',
    confirmText: retoma ? 'Retomar' : reintento ? 'Reintentar' : 'Ejecutar',
    cancelText: 'Cancelar',
    type: 'warning',
  };
}

// Datos del ConfirmDialog de cancelar, segun este en la cola o en curso.
export function dialogoCancelacion(lote: LoteCargaResponse): ConfirmDialogData {
  return {
    title: 'Cancelar ejecución',
    message: lote.estadoLote === EstadoLoteCarga.EN_COLA
      ? `¿Cancelar la ejecución del lote #${lote.loteId}? Sale de la cola al instante y el lote queda cancelado; `
        + 'puede volver a ejecutarlo más adelante.'
      : `¿Cancelar la ejecución del lote #${lote.loteId}? Se detiene después de la fila en curso y cierra las pólizas `
        + 'que alcanzó a modificar. El lote queda cancelado y se puede retomar sin repetir lo ya cargado.',
    confirmText: 'Cancelar ejecución',
    cancelText: 'Volver',
    type: 'danger',
  };
}

const ESTADO_LOTE_LABEL: Record<EstadoLoteCarga, string> = {
  [EstadoLoteCarga.CARGADO]: 'Cargado',
  [EstadoLoteCarga.VALIDANDO]: 'Validando...',
  [EstadoLoteCarga.VALIDADO_OK]: 'Validado OK',
  [EstadoLoteCarga.VALIDADO_CON_ERRORES]: 'Validado con errores',
  [EstadoLoteCarga.ERROR_VALIDACION]: 'Error de validación',
  [EstadoLoteCarga.EN_COLA]: 'En cola',
  [EstadoLoteCarga.EJECUTANDO]: 'Ejecutando...',
  [EstadoLoteCarga.EJECUTADO_OK]: 'Ejecutado OK',
  [EstadoLoteCarga.EJECUTADO_CON_ERRORES]: 'Ejecutado con errores',
  [EstadoLoteCarga.ERROR_EJECUCION]: 'Error de ejecución',
  [EstadoLoteCarga.CANCELADO]: 'Cancelado',
  [EstadoLoteCarga.ELIMINADO]: 'Eliminado',
};

const ESTADO_LOTE_CLASE: Record<EstadoLoteCarga, string> = {
  [EstadoLoteCarga.CARGADO]: 'bg-light-info text-info',
  [EstadoLoteCarga.VALIDANDO]: 'bg-light-warning text-warning',
  [EstadoLoteCarga.VALIDADO_OK]: 'bg-light-success text-success',
  [EstadoLoteCarga.VALIDADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteCarga.ERROR_VALIDACION]: 'bg-light-error text-error',
  [EstadoLoteCarga.EN_COLA]: 'bg-light-info text-info',
  [EstadoLoteCarga.EJECUTANDO]: 'bg-light-warning text-warning',
  [EstadoLoteCarga.EJECUTADO_OK]: 'bg-light-success text-success',
  [EstadoLoteCarga.EJECUTADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteCarga.ERROR_EJECUCION]: 'bg-light-error text-error',
  [EstadoLoteCarga.CANCELADO]: 'bg-light-secondary text-secondary',
  [EstadoLoteCarga.ELIMINADO]: 'bg-light text-dark',
};

export function estadoLoteLabel(estado: EstadoLoteCarga): string {
  return ESTADO_LOTE_LABEL[estado] ?? estado;
}

export function estadoLoteClase(estado: EstadoLoteCarga): string {
  return ESTADO_LOTE_CLASE[estado] ?? 'bg-light-info text-info';
}

// "codigo - nombre".
export function usuarioTexto(usuario: UsuarioCargaMasiva | undefined): string {
  if (!usuario) {
    return '-';
  }

  return usuario.nombre ? `${usuario.codigo} - ${usuario.nombre}` : usuario.codigo;
}

// Para el hover del usuario; vacio si no aplica.
export function usuarioDescripcion(usuario: UsuarioCargaMasiva | undefined): string {
  return usuario?.descripcion ?? '';
}

function formatearFecha(fecha: string | undefined): string {
  return fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

// Info de auditoria para el hover del badge de estado -- prioriza el evento mas reciente.
export function tooltipEstadoLote(lote: LoteCargaResponse): string {
  if (lote.estadoLote === EstadoLoteCarga.ELIMINADO && lote.fechaEliminacion) {
    return `Eliminado el ${formatearFecha(lote.fechaEliminacion)} por ${usuarioTexto(lote.usuarioEliminacion)}`;
  }

  if (lote.estadoLote === EstadoLoteCarga.CANCELADO && lote.fechaCancelacion) {
    return `Ejecución cancelada el ${formatearFecha(lote.fechaCancelacion)} por ${usuarioTexto(lote.usuarioCancelacion)}`;
  }

  if (lote.estadoLote === EstadoLoteCarga.EN_COLA && lote.fechaEncolado) {
    const posicion = lote.posicionCola != null ? ` (posición ${lote.posicionCola})` : '';
    return `En cola desde el ${formatearFecha(lote.fechaEncolado)}${posicion}, pedido por ${usuarioTexto(lote.usuarioEjecucion)}`;
  }

  if (lote.cancelacionPedida && lote.fechaCancelacion) {
    return `Cancelación pedida el ${formatearFecha(lote.fechaCancelacion)} por ${usuarioTexto(lote.usuarioCancelacion)}`;
  }

  if (lote.fechaFinEjecucion && !lote.ejecucionActiva) {
    return `Ejecutado el ${formatearFecha(lote.fechaFinEjecucion)}, pedido por ${usuarioTexto(lote.usuarioEjecucion)}`;
  }

  if (lote.fechaInicioEjecucion && lote.ejecucionActiva) {
    return `Ejecución iniciada el ${formatearFecha(lote.fechaInicioEjecucion)}, pedida por ${usuarioTexto(lote.usuarioEjecucion)}`;
  }

  if (lote.fechaValidacion) {
    return `Validado el ${formatearFecha(lote.fechaValidacion)} por ${usuarioTexto(lote.usuarioValidacion)}`;
  }

  return '';
}

export function tieneErrorLote(lote: LoteCargaResponse): boolean {
  return (lote.estadoLote === EstadoLoteCarga.ERROR_VALIDACION || lote.estadoLote === EstadoLoteCarga.ERROR_EJECUCION)
    && !!lote.mensajeError;
}

const ESTADO_DETALLE_LABEL: Record<EstadoDetalleCarga, string> = {
  [EstadoDetalleCarga.PENDIENTE]: 'Pendiente',
  [EstadoDetalleCarga.OK]: 'OK',
  [EstadoDetalleCarga.ERROR]: 'Error',
  [EstadoDetalleCarga.OMITIDO]: 'Omitido',
  [EstadoDetalleCarga.EJECUTADO]: 'Ejecutado',
  [EstadoDetalleCarga.ERROR_EJECUCION]: 'Error al grabar',
};

const ESTADO_DETALLE_CLASE: Record<EstadoDetalleCarga, string> = {
  [EstadoDetalleCarga.PENDIENTE]: 'bg-light-info text-info',
  [EstadoDetalleCarga.OK]: 'bg-light-success text-success',
  [EstadoDetalleCarga.ERROR]: 'bg-light-error text-error',
  [EstadoDetalleCarga.OMITIDO]: 'bg-light text-dark',
  [EstadoDetalleCarga.EJECUTADO]: 'bg-light-success text-success',
  [EstadoDetalleCarga.ERROR_EJECUCION]: 'bg-light-error text-error',
};

export function estadoDetalleLabel(estado: EstadoDetalleCarga): string {
  return ESTADO_DETALLE_LABEL[estado] ?? estado;
}

export function estadoDetalleClase(estado: EstadoDetalleCarga): string {
  return ESTADO_DETALLE_CLASE[estado] ?? 'bg-light-info text-info';
}

// Replica el split del SP de validacion (concatena motivos separados por "; ").
export function motivosError(registroError: string | undefined): string[] {
  if (!registroError) {
    return [];
  }

  return registroError.split(';').map(motivo => motivo.trim()).filter(motivo => motivo.length > 0);
}

// Hover del badge de estado: el motivo completo si es uno solo, o un resumen si son varios.
export function tooltipRegistroError(registroError: string | undefined): string {
  const motivos = motivosError(registroError);

  if (motivos.length === 0) {
    return '';
  }

  return motivos.length === 1 ? motivos[0] : `${motivos.length} errores`;
}

const LAYOUT_LABEL: Record<LayoutPlanilla, string> = {
  [LayoutPlanilla.VEHICULOS]: 'Vehículos',
  [LayoutPlanilla.NO_VEHICULOS]: 'No vehículos',
};

export function layoutLabel(layout: LayoutPlanilla | undefined): string {
  return layout ? (LAYOUT_LABEL[layout] ?? layout) : '-';
}

const FECHA_PROPUESTA_ORIGEN_LABEL: Record<FechaPropuestaOrigen, string> = {
  [FechaPropuestaOrigen.INICIO_VIGENCIA]: 'Fecha de inicio de vigencia',
  [FechaPropuestaOrigen.FIJA]: 'Fecha fija',
};

export function fechaPropuestaOrigenLabel(origen: FechaPropuestaOrigen | undefined): string {
  return origen ? (FECHA_PROPUESTA_ORIGEN_LABEL[origen] ?? origen) : '-';
}

const FECHAS_EMISION_ORIGEN_LABEL: Record<FechasEmisionOrigen, string> = {
  [FechasEmisionOrigen.PANTALLA]: 'Pantalla (mismas fechas para todas las filas)',
  [FechasEmisionOrigen.PLANILLA]: 'Planilla (fechas de cada fila)',
};

export function fechasEmisionOrigenLabel(origen: FechasEmisionOrigen | undefined): string {
  return origen ? (FECHAS_EMISION_ORIGEN_LABEL[origen] ?? origen) : '-';
}

// Combo_FPago del legacy (PPAG_FORMA_PAGO).
export const FORMAS_PAGO: { codigo: number; descripcion: string }[] = [
  { codigo: 0, descripcion: 'Cheque' },
  { codigo: 1, descripcion: 'Tarjeta de crédito bancaria' },
  { codigo: 2, descripcion: 'Tarjeta de crédito otras instituciones' },
  { codigo: 3, descripcion: 'Cargo cuenta corriente' },
  { codigo: 4, descripcion: 'Cuponera / Plan de pago compañía' },
  { codigo: 5, descripcion: 'Cargo dividendo' },
  { codigo: 6, descripcion: 'Descuento por planilla' },
  { codigo: 7, descripcion: 'Efectivo' },
];

export function formaPagoLabel(codigo: number | undefined): string {
  if (codigo == null) {
    return '-';
  }

  const forma = FORMAS_PAGO.find(f => f.codigo === codigo);
  return forma ? `${codigo} - ${forma.descripcion}` : `${codigo}`;
}

// Datos que pide Ing_FormaPago segun la forma de pago (la 2 no pide nada, como en el VB6).
export function formaPagoPideInstitucion(codigo: number | null | undefined): boolean {
  return codigo === 0 || codigo === 1 || codigo === 5;
}

export function formaPagoPideBancoEmisor(codigo: number | null | undefined): boolean {
  return codigo === 1 || codigo === 3;
}

export function formaPagoPideNumero(codigo: number | null | undefined): boolean {
  return codigo != null && [0, 1, 3, 5].includes(codigo);
}

// Catalogo del campo institucion: tarjeta bancaria usa tarjetas (tipo 1); cheque y dividendo, bancos (tipo 2).
export function formaPagoTipoInstitucion(codigo: number | null | undefined): 1 | 2 {
  return codigo === 1 ? 1 : 2;
}

export function etiquetaInstitucion(codigo: number | null | undefined): string {
  return codigo === 0 ? 'Banco' : 'Institución financiera';
}

export function etiquetaNumero(codigo: number | null | undefined): string {
  switch (codigo) {
    case 0: return 'N° de cheque';
    case 1: return 'N° de tarjeta';
    case 3: return 'N° de cuenta corriente';
    case 5: return 'N° de dividendo';
    default: return 'Número';
  }
}

export function siNo(valor: boolean | undefined): string {
  return valor ? 'Sí' : 'No';
}
