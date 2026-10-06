// Config de matching/archivo por compania (mantenedor CMAS_PDF). Sin campo de eliminacion -- el
// backend no expone DELETE para este recurso.
export interface CmasPdf {
  ciasCodigo: number;
  posFactura?: number;
  larFactura?: number;
  posFacturaNom?: number;
  larFacturaNom?: number;
  posPolizaNom?: number;
  larPolizaNom?: number;
  tipoRut?: number;
  ciaRepitePoliza?: string;
  aNombreDe?: string;
  rut?: string;
  banco?: string;
  ctacte?: string;
  fantasia?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  tipoNomina?: string;
  prefijo?: string;
  tipoMatch?: 'SUBSTRING' | 'EXACTO';
}
