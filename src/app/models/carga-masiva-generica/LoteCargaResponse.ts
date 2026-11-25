import { AplicaSobre } from './AplicaSobre';
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
  nuevoOrganizador: boolean;
  codOrganizador?: number;
  porComOrganizador?: number;
  nuevoCobrador: boolean;
  codCobrador?: number;
  porComCobrador?: number;
  // Intermediarios de pantalla (carga 2); el organizador y el cobrador son los de arriba.
  codProductor?: number;
  porComProductor?: number;
  aplicaProductor?: AplicaSobre;
  aplicaOrganizador?: AplicaSobre;
  codIntermediario?: number;
  porComIntermediario?: number;
  aplicaIntermediario?: AplicaSobre;
  codAgencia?: number;
  porComAgencia?: number;
  aplicaAgencia?: AplicaSobre;
  codEjecutivo?: number;
  porComEjecutivo?: number;
  aplicaEjecutivo?: AplicaSobre;
  aplicaCobrador?: AplicaSobre;
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
  // Se detiene despues de la fila en curso.
  cancelacionPedida: boolean;
  // Solo en el detalle; volver a ejecutar las cierra.
  polizasSinCerrar?: number;
  // Solo en el detalle; se revisan a mano (motivo en el log).
  polizasCierreError?: number;
  // Solo en el detalle (carga 3): numeros de poliza pendientes de elegir con filas sin ejecutar.
  polizasPorElegir?: number;
}
