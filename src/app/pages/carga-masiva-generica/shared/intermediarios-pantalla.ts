import { AplicaSobre } from 'src/app/models/carga-masiva-generica/AplicaSobre';
import { RolIntermediario } from 'src/app/models/carga-masiva-generica/RolIntermediario';

// Campos de CargarLoteRequestDto / LoteResponseDto de un rol de intermediacion de pantalla.
export interface RolPantalla {
  rol: RolIntermediario;
  etiqueta: string;
  campoCodigo: 'codProductor' | 'codOrganizador' | 'codIntermediario' | 'codAgencia' | 'codEjecutivo' | 'codCobrador';
  campoPorcentaje: 'porComProductor' | 'porComOrganizador' | 'porComIntermediario' | 'porComAgencia'
    | 'porComEjecutivo' | 'porComCobrador';
  campoAplica: 'aplicaProductor' | 'aplicaOrganizador' | 'aplicaIntermediario' | 'aplicaAgencia'
    | 'aplicaEjecutivo' | 'aplicaCobrador';
  // Valor que usa el backend si no se elige.
  aplicaPorDefecto: AplicaSobre;
  opcionesAplica: AplicaSobre[];
}

const TODAS = [AplicaSobre.PRIN, AplicaSobre.PRIT, AplicaSobre.COMP];

// En el orden de la pantalla del VB6.
export const ROLES_PANTALLA: RolPantalla[] = [
  {
    rol: RolIntermediario.PROD, etiqueta: 'Productor', campoCodigo: 'codProductor', campoPorcentaje: 'porComProductor',
    campoAplica: 'aplicaProductor', aplicaPorDefecto: AplicaSobre.PRIT, opcionesAplica: [AplicaSobre.PRIN, AplicaSobre.PRIT],
  },
  {
    rol: RolIntermediario.ORGA, etiqueta: 'Organizador', campoCodigo: 'codOrganizador', campoPorcentaje: 'porComOrganizador',
    campoAplica: 'aplicaOrganizador', aplicaPorDefecto: AplicaSobre.COMP, opcionesAplica: TODAS,
  },
  {
    rol: RolIntermediario.INTE, etiqueta: 'Intermediario', campoCodigo: 'codIntermediario',
    campoPorcentaje: 'porComIntermediario', campoAplica: 'aplicaIntermediario', aplicaPorDefecto: AplicaSobre.COMP,
    opcionesAplica: TODAS,
  },
  {
    rol: RolIntermediario.AGEN, etiqueta: 'Agencia', campoCodigo: 'codAgencia', campoPorcentaje: 'porComAgencia',
    campoAplica: 'aplicaAgencia', aplicaPorDefecto: AplicaSobre.COMP, opcionesAplica: TODAS,
  },
  {
    rol: RolIntermediario.EJEC, etiqueta: 'Ejecutivo', campoCodigo: 'codEjecutivo', campoPorcentaje: 'porComEjecutivo',
    campoAplica: 'aplicaEjecutivo', aplicaPorDefecto: AplicaSobre.COMP, opcionesAplica: TODAS,
  },
  {
    rol: RolIntermediario.COBR, etiqueta: 'Cobrador', campoCodigo: 'codCobrador', campoPorcentaje: 'porComCobrador',
    campoAplica: 'aplicaCobrador', aplicaPorDefecto: AplicaSobre.COMP, opcionesAplica: TODAS,
  },
];

// Nuevo organizador / nuevo cobrador (carga 1): mismos campos de codigo y %, sin "aplica sobre".
export const ROLES_NUEVOS = ROLES_PANTALLA.filter(r => r.rol === RolIntermediario.ORGA || r.rol === RolIntermediario.COBR);

// Productor propuesto al elegir el ramo (Cod_Productor = 1 del VB6: la corredora).
export const PRODUCTOR_POR_DEFECTO = 1;

// Con esta relacion los % quedan en 0.
export const RELACION_COMISION_POR_COBERTURA = 2;
