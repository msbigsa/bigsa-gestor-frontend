// Llave usada para matchear el nombre del PDF dentro del zip de documentos (fase 3).
// RUT_ASEGURADO/POLIZA_RUT_ASEGURADO solo tienen sentido si CodDestinatario incluye ASEGURADO.
export enum CodLlaveBusqueda {
  POLIZA = 'POLIZA',
  POLIZA_ENDOSO = 'POLIZA_ENDOSO',
  RUT_CONTRATANTE = 'RUT_CONTRATANTE',
  POLIZA_RUT_CONTRATANTE = 'POLIZA_RUT_CONTRATANTE',
  RUT_ASEGURADO = 'RUT_ASEGURADO',
  POLIZA_RUT_ASEGURADO = 'POLIZA_RUT_ASEGURADO',
}
