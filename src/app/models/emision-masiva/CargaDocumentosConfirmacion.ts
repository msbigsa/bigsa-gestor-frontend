import { EstadoCargaDocumentos } from './EstadoCargaDocumentos';

// Respuesta inmediata al disparar /procesar -- el matching en si corre en background, este es solo
// el id para hacer polling (ver CargaDocumentosResponse).
export interface CargaDocumentosConfirmacion {
  cargaDocId: number;
  loteId: number;
  estado: EstadoCargaDocumentos;
  fechaCarga: string;
}
