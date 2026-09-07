// Respuesta sincrona de subir un .zip/.pdf -- solo confirma que se copio a la carpeta de staging,
// todavia no hay ningun matching hecho (eso es un paso aparte, ver CargaDocumentosResponse).
export interface CargaArchivosResponse {
  loteId: number;
  directorio: string;
  archivosExtraidos: number;
}
