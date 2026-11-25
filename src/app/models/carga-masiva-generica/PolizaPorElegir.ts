import { PolizaCandidata } from './PolizaCandidata';

// Numero de la planilla con mas de una poliza emitida en la compania (carga 3); la eleccion vale para todas sus filas.
export interface PolizaPorElegir {
  ciasCodigo: number;
  nroPoliza: string;
  // Vacio si la planilla no trae digito; es parte de la llave y se devuelve tal cual.
  digPoliza: string;
  // Como viene en la planilla ("455" o "455-A").
  poliza: string;
  // Null = pendiente.
  docuCodigoElegido: number | null;
  usuarioDecision?: string;
  fechaDecision?: string;
  candidatas: PolizaCandidata[];
  // Filas de la planilla que dependen de la eleccion.
  filas: number[];
}
