// Plan de pago (PRO_FORMA_DE_PAGO); numeroCuotas dice cuantas fechas de vencimiento se ingresan.
export interface PlanPago {
  fpagCodigo: number;
  descripcion: string;
  porcAnticipo: number;
  numeroCuotas: number;
}
