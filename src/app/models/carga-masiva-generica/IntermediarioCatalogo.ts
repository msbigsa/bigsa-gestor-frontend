import { AplicaSobre } from './AplicaSobre';

// Intermediario de un rol para una compania, negocio y ramo, con su % y "aplica sobre" nominales.
export interface IntermediarioCatalogo {
  codigo: number;
  descripcion: string;
  porcentaje?: number;
  aplicaSobre?: AplicaSobre;
}
