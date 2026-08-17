import { Nivel } from "./Nivel";

export interface Usuario {
    codigo?: number;
    nombre?: string;
    descripcion?: string;
    correo: string;
    nivel: Nivel;
    // Data URI (data:image/...;base64,...) o URL absoluta -- si el backend no la manda, el avatar cae a iniciales.
    imagen?: string;
}