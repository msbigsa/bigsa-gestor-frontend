import { RolIntermediario } from './RolIntermediario';

// GET /niveles-intermediacion: lo que la carga 2 exige de los intermediarios de pantalla (NIV_PART y COMI_NOMINAL).
export interface NivelesIntermediacion {
  // Sin el productor, que siempre es obligatorio.
  rolesObligatorios: RolIntermediario[];
  // Aplica al % del productor y al de los roles obligatorios.
  porcentajeObligatorio: boolean;
}
