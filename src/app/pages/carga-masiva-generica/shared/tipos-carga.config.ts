import { TipoCarga } from 'src/app/models/carga-masiva-generica/TipoCarga';

// Diferencias de pantalla por tipo de carga que no vienen en TipoCargaDisponible.
export interface ConfigTipoCarga {
  // Ramo obligatorio con compania unica.
  ramoObligatorio: boolean;
  // Plan de cobertura y moneda (y "usar los de la planilla").
  usaPlanYMoneda: boolean;
  // Ayuda sobre la planilla esperada.
  ayudaPlanilla: string;
}

const CONFIG_POR_DEFECTO: ConfigTipoCarga = {
  ramoObligatorio: false,
  usaPlanYMoneda: true,
  ayudaPlanilla: '',
};

// Agregar aqui cada tipo nuevo cuando el backend lo implemente.
const CONFIG_TIPOS_CARGA: Partial<Record<TipoCarga, ConfigTipoCarga>> = {
  [TipoCarga.ITEMS_POLIZA_EXISTENTE]: {
    ramoObligatorio: true,
    // Plan y moneda se copian de la poliza.
    usaPlanYMoneda: false,
    ayudaPlanilla: 'Una fila por ítem. Las filas consecutivas con el mismo número de póliza (columna A) forman un grupo. '
      + 'El layout (vehículos o no vehículos) se detecta por los títulos de la fila 1.',
  },
};

export function configTipoCarga(tipo: TipoCarga | null | undefined): ConfigTipoCarga {
  return (tipo && CONFIG_TIPOS_CARGA[tipo]) || CONFIG_POR_DEFECTO;
}
