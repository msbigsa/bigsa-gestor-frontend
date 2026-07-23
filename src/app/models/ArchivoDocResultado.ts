import { Usuario } from "./Usuario";

export interface ArchivoDocResultado {
    id?: number;
    idDocumento?: number;
    version?: number;
    usuario: Usuario;
	fechaCreacion: string;  
}



