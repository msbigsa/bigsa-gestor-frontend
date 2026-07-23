import { Usuario } from "./Usuario";

export interface ArchivoDoc {
    id?: number;
    nombre?: string;
    nombreDocumento?: string;       
    usuario: Usuario;
    fechaSubida: string;
    versionActual: number;
    fechaUltimaGeneracion: string;    
}