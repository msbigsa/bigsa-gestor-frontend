import { EstadoLoteCarga } from './EstadoLoteCarga';
import { FechaPropuestaOrigen } from './FechaPropuestaOrigen';
import { FechasEmisionOrigen } from './FechasEmisionOrigen';
import { FormatoArchivo } from './FormatoArchivo';
import { LayoutPlanilla } from './LayoutPlanilla';
import { TipoCarga } from './TipoCarga';
import { UsuarioCargaMasiva } from './UsuarioCargaMasiva';

// Con "Multiples Companias" los parametros que vienen por fila llegan vacios.
export interface LoteCargaResponse {
  loteId: number;
  loteOrigenId?: number;
  tipoCarga: TipoCarga;
  tipoCargaDescripcion: string;
  nombreArchivoOrigen: string;
  formatoArchivo: FormatoArchivo;
  layout?: LayoutPlanilla;
  fechaCarga: string;
  usuarioCarga?: UsuarioCargaMasiva;

  multiplesCompanias: boolean;
  ciasCodigo?: number;
  negoCodigo?: number;
  ramoCodigo?: number;
  plcoCorrelativo?: number;
  domiMoneCod?: string;
  usaPlanPlanilla: boolean;
  usaMonedaPlanilla: boolean;
  modificaFecNacSexo: boolean;
  modificaDireccion: boolean;
  fechaPropuestaOrigen?: FechaPropuestaOrigen;
  fechaPropuesta?: string;
  dejaEmitido: boolean;
  fechasEmisionOrigen?: FechasEmisionOrigen;
  fechaEmision?: string;
  fechaRecepcion?: string;
  registraPago: boolean;
  pagoPorItem: boolean;
  pagoDesdePlanilla: boolean;
  fpagCodigo?: number;
  formaPago?: number;
  ifinCodigo?: number;
  ifinCodigoEmisor?: number;
  nroTransaccion?: string;
  fechaPago?: string;
  porcDescuento?: number;
  glosaPago?: string;
  fechasVencimiento?: string[];

  totalFilas: number;
  totalFilasOk?: number;
  totalFilasError?: number;
  estadoLote: EstadoLoteCarga;
  mensajeError?: string;
  fechaValidacion?: string;
  usuarioValidacion?: UsuarioCargaMasiva;
  fechaEliminacion?: string;
  usuarioEliminacion?: UsuarioCargaMasiva;

  // Ejecucion por la cola
  idSolicitud?: string;
  intentoEjecucion?: number;
  // Hay una ejecucion en curso (encolada, revalidando o ejecutando): no se permiten otras acciones.
  ejecucionActiva: boolean;
  // Posicion en la cola mientras esta EN_COLA (solo en el detalle del lote).
  posicionCola?: number;
  fechaEncolado?: string;
  usuarioEjecucion?: UsuarioCargaMasiva;
  fechaInicioEjecucion?: string;
  fechaFinEjecucion?: string;
  totalFilasEjecutadas?: number;
  totalFilasErrorEjecucion?: number;
  fechaCancelacion?: string;
  usuarioCancelacion?: UsuarioCargaMasiva;
}
