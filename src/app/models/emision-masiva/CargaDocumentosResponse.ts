import { EstadoCargaDocumentos } from './EstadoCargaDocumentos';

// Un intento de "procesar" (matching + copia). Las 3 listas de nombres son las que NO quedaron
// asignadas a ninguna fila -- lo que si matcheo se ve por fila en LoteEmisionDetalleResponse
// (nombreArchivoPdfResuelto), no aca.
export interface CargaDocumentosResponse {
  cargaDocId: number;
  loteId: number;
  fechaCarga: string;
  usuarioCarga?: string;
  totalArchivosEnCarpeta?: number;
  totalDocumentosMatcheados?: number;
  estado: EstadoCargaDocumentos;
  mensajeError?: string;
  archivosSinFilaCorrespondiente: string[];
  archivosDeFilasConError: string[];
  archivosConFalloTecnico: string[];
  totalArchivosSinFilaCorrespondiente?: number;
  totalArchivosDeFilasConError?: number;
  totalArchivosConFalloTecnico?: number;
}
