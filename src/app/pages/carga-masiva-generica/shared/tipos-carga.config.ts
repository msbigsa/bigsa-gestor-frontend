import { TipoCarga } from 'src/app/models/carga-masiva-generica/TipoCarga';

// Diferencias de pantalla por tipo de carga que no vienen en TipoCargaDisponible.
export interface ConfigTipoCarga {
  // Obligatorios con compania unica.
  negocioObligatorio: boolean;
  ramoObligatorio: boolean;
  // Plan de cobertura de pantalla y "usar plan de la planilla".
  usaPlan: boolean;
  // Con compania unica, salvo "usar plan de la planilla".
  planObligatorio: boolean;
  // Que pasa si no se indica el plan.
  ayudaPlan: string;
  // Moneda de pantalla y "usar moneda de la planilla".
  usaMoneda: boolean;
  // Con compania unica, salvo "usar moneda de la planilla".
  monedaObligatoria: boolean;
  // Productor, organizador, intermediario, agencia, ejecutivo y cobrador de pantalla.
  intermediariosPantalla: boolean;
  // Una fila rechazada porque el documento ya existe puede pagar ese documento.
  pagaDocumentoExistente: boolean;
  // Con mas de una poliza emitida por numero, se elige en el detalle del lote antes de ejecutar.
  eligePolizas: boolean;
  // Que es la "Propuesta" del listado de filas.
  ayudaPropuesta: string;
  // Ayuda sobre la planilla esperada.
  ayudaPlanilla: string;
}

const CONFIG_POR_DEFECTO: ConfigTipoCarga = {
  negocioObligatorio: false,
  ramoObligatorio: false,
  usaPlan: true,
  planObligatorio: false,
  ayudaPlan: '',
  usaMoneda: true,
  monedaObligatoria: false,
  intermediariosPantalla: false,
  pagaDocumentoExistente: false,
  eligePolizas: false,
  ayudaPropuesta: 'Propuesta BIGSA asociada a la fila',
  ayudaPlanilla: '',
};

const LAYOUT = 'El layout (vehículos o no vehículos) se detecta por los títulos de la fila 1.';

// Agregar aqui cada tipo nuevo cuando el backend lo implemente.
const CONFIG_TIPOS_CARGA: Partial<Record<TipoCarga, ConfigTipoCarga>> = {
  [TipoCarga.ITEMS_POLIZA_EXISTENTE]: {
    ...CONFIG_POR_DEFECTO,
    ramoObligatorio: true,
    // Plan y moneda se copian de la poliza.
    usaPlan: false,
    usaMoneda: false,
    ayudaPropuesta: 'Propuesta BIGSA de la póliza a la que se agrega el ítem',
    ayudaPlanilla: 'Una fila por ítem. Las filas consecutivas con el mismo número de póliza (columna A) forman un grupo. '
      + LAYOUT,
  },
  [TipoCarga.ENDOSO_AUMENTO_UN_ITEM]: {
    ...CONFIG_POR_DEFECTO,
    // La poliza se busca por ramo: sin el, no se encuentra ninguna.
    ramoObligatorio: true,
    // Sin plan, el endoso usa las coberturas de la poliza; la moneda es la de la poliza.
    ayudaPlan: 'Sin plan, el endoso usa las coberturas de la póliza.',
    usaMoneda: false,
    pagaDocumentoExistente: true,
    ayudaPropuesta: 'Propuesta BIGSA del endoso creado (existe después de ejecutar)',
    ayudaPlanilla: 'Una fila por endoso: cada fila crea un endoso de aumento con un ítem en la póliza de la columna A. '
      + 'La planilla se lee hasta la primera fila con la columna A vacía. ' + LAYOUT,
  },
  [TipoCarga.POLIZAS_INDIVIDUALES]: {
    ...CONFIG_POR_DEFECTO,
    negocioObligatorio: true,
    ramoObligatorio: true,
    planObligatorio: true,
    monedaObligatoria: true,
    intermediariosPantalla: true,
    pagaDocumentoExistente: true,
    ayudaPropuesta: 'Propuesta BIGSA de la póliza creada (existe después de ejecutar)',
    ayudaPlanilla: 'Una fila por póliza: cada fila crea una póliza con el ítem 1. La planilla se lee hasta la primera '
      + 'fila sin RUT del contratante (columna D). ' + LAYOUT,
  },
  [TipoCarga.CERTIFICADOS_TRANSPORTE]: {
    ...CONFIG_POR_DEFECTO,
    // La poliza se busca solo por compania y numero (SolicitaDatos.frm:1431-1436); plan y moneda son los de la poliza.
    usaPlan: false,
    usaMoneda: false,
    pagaDocumentoExistente: true,
    // Muestra_Polizas del legacy: la poliza se busca sin ramo.
    eligePolizas: true,
    ayudaPropuesta: 'Propuesta BIGSA del endoso creado (existe después de ejecutar)',
    // Sin LAYOUT: siempre columnas de no vehiculos.
    ayudaPlanilla: 'Una fila por certificado: cada fila crea un endoso de aumento con un ítem en la póliza de la '
      + 'columna A (compañía + número, con o sin dígito). La planilla se lee hasta la primera fila con la columna A '
      + 'vacía. Siempre se usan las columnas de no vehículos. Con «usar planilla», la forma de pago se toma de las '
      + 'columnas BY a CE.',
  },
};

export function configTipoCarga(tipo: TipoCarga | null | undefined): ConfigTipoCarga {
  return (tipo && CONFIG_TIPOS_CARGA[tipo]) || CONFIG_POR_DEFECTO;
}
