export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaTipo?: string;
  referenciaId?: string;
  leida: boolean;
  fechaCreacion: string;
}
