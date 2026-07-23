import { Nivel } from "./Nivel";

export interface Usuario {
    codigo?: number;
    nombre?: string;
    descripcion?: string;
    correo: string;
    nivel: Nivel;   
}