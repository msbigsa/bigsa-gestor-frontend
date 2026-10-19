import { EstadoLoteCarga } from 'src/app/models/carga-masiva-generica/EstadoLoteCarga';
import { EstadoDetalleCarga } from 'src/app/models/carga-masiva-generica/EstadoDetalleCarga';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { UsuarioCargaMasiva } from 'src/app/models/carga-masiva-generica/UsuarioCargaMasiva';
import { LayoutPlanilla } from 'src/app/models/carga-masiva-generica/LayoutPlanilla';
import { FechaPropuestaOrigen } from 'src/app/models/carga-masiva-generica/FechaPropuestaOrigen';
import { FechasEmisionOrigen } from 'src/app/models/carga-masiva-generica/FechasEmisionOrigen';

// Coincide con EstadoLoteCarga.INTERMEDIOS del backend.
export const ESTADOS_EN_PROCESO: EstadoLoteCarga[] = [EstadoLoteCarga.VALIDANDO];

// Estados desde los que se podra ejecutar el lote cuando exista la fase de ejecucion.
export const ESTADOS_EJECUTABLES: EstadoLoteCarga[] = [EstadoLoteCarga.VALIDADO_OK, EstadoLoteCarga.VALIDADO_CON_ERRORES];

// Corte D-17: la ejecucion no tiene endpoint todavia; el boton se muestra deshabilitado.
export const EJECUCION_DISPONIBLE = false;
export const AVISO_EJECUCION_NO_DISPONIBLE =
  'La ejecución aún no está disponible: se habilitará cuando se defina su mecanismo en el backend.';

const ESTADO_LOTE_LABEL: Record<EstadoLoteCarga, string> = {
  [EstadoLoteCarga.CARGADO]: 'Cargado',
  [EstadoLoteCarga.VALIDANDO]: 'Validando...',
  [EstadoLoteCarga.VALIDADO_OK]: 'Validado OK',
  [EstadoLoteCarga.VALIDADO_CON_ERRORES]: 'Validado con errores',
  [EstadoLoteCarga.ERROR_VALIDACION]: 'Error de validación',
  [EstadoLoteCarga.ELIMINADO]: 'Eliminado',
};

const ESTADO_LOTE_CLASE: Record<EstadoLoteCarga, string> = {
  [EstadoLoteCarga.CARGADO]: 'bg-light-info text-info',
  [EstadoLoteCarga.VALIDANDO]: 'bg-light-warning text-warning',
  [EstadoLoteCarga.VALIDADO_OK]: 'bg-light-success text-success',
  [EstadoLoteCarga.VALIDADO_CON_ERRORES]: 'bg-light-warning text-warning',
  [EstadoLoteCarga.ERROR_VALIDACION]: 'bg-light-error text-error',
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

  if (lote.fechaValidacion) {
    return `Validado el ${formatearFecha(lote.fechaValidacion)} por ${usuarioTexto(lote.usuarioValidacion)}`;
  }

  return '';
}

export function tieneErrorLote(lote: LoteCargaResponse): boolean {
  return lote.estadoLote === EstadoLoteCarga.ERROR_VALIDACION && !!lote.mensajeError;
}

const ESTADO_DETALLE_LABEL: Record<EstadoDetalleCarga, string> = {
  [EstadoDetalleCarga.PENDIENTE]: 'Pendiente',
  [EstadoDetalleCarga.OK]: 'OK',
  [EstadoDetalleCarga.ERROR]: 'Error',
  [EstadoDetalleCarga.OMITIDO]: 'Omitido',
};

const ESTADO_DETALLE_CLASE: Record<EstadoDetalleCarga, string> = {
  [EstadoDetalleCarga.PENDIENTE]: 'bg-light-info text-info',
  [EstadoDetalleCarga.OK]: 'bg-light-success text-success',
  [EstadoDetalleCarga.ERROR]: 'bg-light-error text-error',
  [EstadoDetalleCarga.OMITIDO]: 'bg-light text-dark',
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
