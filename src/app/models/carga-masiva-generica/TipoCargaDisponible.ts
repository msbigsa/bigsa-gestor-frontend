import { TipoCarga } from './TipoCarga';

// Tipo de carga con procesador implementado (GET /tipos-carga).
export interface TipoCargaDisponible {
  tipoCarga: TipoCarga;
  opcionLegacy: number;
  descripcion: string;
  permiteDejarEmitido: boolean;
  permiteMultiplesCompanias: boolean;
}
