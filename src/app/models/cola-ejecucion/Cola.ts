import { GrupoCola } from './GrupoCola';

// Respuesta de GET /cola: la cola activa completa, sin paginar.
export interface Cola {
  grupos: GrupoCola[];
}
