// Poliza emitida que calza con el numero de la planilla (carga 3).
export interface PolizaCandidata {
  docuCodigo: number;
  // Numero y digito ("455-A").
  poliza: string;
  ramoCodigo?: number;
  ramoDescripcion?: string;
  // RUT y digito ("9793023-K").
  contratanteRut?: string;
  contratanteNombre?: string;
  inicioVigencia?: string;
  terminoVigencia?: string;
}
