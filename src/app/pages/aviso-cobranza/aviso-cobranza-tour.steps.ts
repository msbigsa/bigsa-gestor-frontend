import type { StepOptions } from 'shepherd.js';

/**
 * Pasos del tour guiado para el listado de lotes de avisos de cobranza.
 * Los selectores [data-tour="..."] se marcan en listar-lotes.component.html.
 * El paso de "Cargar nueva planilla" solo se incluye si el usuario tiene acceso a esa pantalla
 * (ver MenuService.tieneAcceso), y el de "Acciones" solo si existen registros en la tabla.
 */
export function buildListarLotesTourSteps(hayRegistros: boolean, puedeCargarLote: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'lote-filtro-estado',
      title: 'Filtrar por estado',
      text: 'Filtre los lotes según su estado (cargado, validado, enviado, con errores, etc.).',
      attachTo: { element: '[data-tour="lote-filtro-estado"]', on: 'bottom' },
    },
    {
      id: 'lote-filtro-compania',
      title: 'Filtrar por compañía',
      text: 'También puede filtrar los lotes por la compañía a la que pertenecen.',
      attachTo: { element: '[data-tour="lote-filtro-compania"]', on: 'bottom' },
    },
    {
      id: 'lote-mostrar-eliminados',
      title: 'Mostrar eliminados',
      text: 'Active esta opción para incluir en el listado los lotes que fueron eliminados.',
      attachTo: { element: '[data-tour="lote-mostrar-eliminados"]', on: 'bottom' },
    },
  ];

  if (puedeCargarLote) {
    pasos.push({
      id: 'lote-cargar',
      title: 'Cargar nueva planilla',
      text: 'Presione este botón para subir una nueva planilla de avisos de cobranza.',
      attachTo: { element: '[data-tour="lote-cargar"]', on: 'bottom' },
    });
  }

  if (hayRegistros) {
    pasos.push({
      id: 'lote-accion',
      title: 'Acciones del lote',
      text: 'Desde aquí puede ver el detalle, validar, enviar o eliminar el lote.',
      attachTo: { element: '[data-tour="lote-accion"]', on: 'left' },
    });
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el formulario de carga de una planilla de avisos de cobranza.
 * Los selectores [data-tour="..."] se marcan en cargar-lote.component.html.
 * El formulario no cambia de layout según estado (a diferencia de word-html-converter),
 * así que los pasos son siempre los mismos.
 */
export function buildCargarLoteTourSteps(): StepOptions[] {
  return [
    {
      id: 'carga-compania',
      title: 'Paso 1: Compañía',
      text: 'Busque y seleccione la compañía a la que pertenece la planilla.',
      attachTo: { element: '[data-tour="carga-compania"]', on: 'bottom' },
    },
    {
      id: 'carga-plantilla-cliente',
      title: 'Paso 2: Plantilla para el cliente',
      text: 'Seleccione la plantilla de correo que se usará para el aviso enviado al cliente.',
      attachTo: { element: '[data-tour="carga-plantilla-cliente"]', on: 'bottom' },
    },
    {
      id: 'carga-plantilla-ejecutivo',
      title: 'Paso 3: Plantilla para el ejecutivo',
      text: 'Seleccione la plantilla de correo que se usará para el aviso enviado al ejecutivo.',
      attachTo: { element: '[data-tour="carga-plantilla-ejecutivo"]', on: 'bottom' },
    },
    {
      id: 'carga-opciones',
      title: 'Opciones adicionales',
      text: 'Puede copiar al cobrador y/o al ejecutivo del documento, y excluir la forma de pago "Descuento por Planilla".',
      attachTo: { element: '[data-tour="carga-opciones"]', on: 'top' },
    },
    {
      id: 'carga-cobradores',
      title: 'Cobradores incluidos',
      text: 'Todos los cobradores vienen marcados por defecto. Desmarque aquellos que no se correspondan con la carga.',
      attachTo: { element: '[data-tour="carga-cobradores"]', on: 'top' },
    },
    {
      id: 'carga-archivo',
      title: 'Paso 4: Archivo de la planilla',
      text: 'Arrastre aquí el archivo CSV o Excel (.xlsx) con los datos a cargar, o haga clic para seleccionarlo.',
      attachTo: { element: '[data-tour="carga-archivo"]', on: 'top' },
    },
    {
      id: 'carga-enviar',
      title: 'Cargar planilla',
      text: 'Una vez completados los datos, presione este botón para cargar la planilla.',
      attachTo: { element: '[data-tour="carga-enviar"]', on: 'top' },
    },
  ];
}

/**
 * Pasos del tour guiado para el detalle de un lote de avisos de cobranza.
 * Los selectores [data-tour="..."] se marcan en detalle-lote.component.html.
 * Cada sección se incluye solo si es visible en el estado actual del lote
 * (por ejemplo, un lote eliminado no muestra acciones ni tabla de registros).
 */
export function buildDetalleLoteTourSteps(
  hayAcciones: boolean,
  puedeDescargar: boolean,
  mostrarTablaDetalles: boolean,
  hayRegistrosDetalle: boolean,
): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'detalle-resumen',
      title: 'Resumen del lote',
      text: 'Aquí puede ver el resumen de filas totales, válidas, con error, omitidas y enviadas.',
      attachTo: { element: '[data-tour="detalle-resumen"]', on: 'bottom' },
    },
  ];

  if (hayAcciones) {
    pasos.push({
      id: 'detalle-acciones',
      title: 'Acciones del lote',
      text: 'Desde aquí puede validar, enviar, cargar una corrección o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="detalle-acciones"]', on: 'bottom' },
    });
  }

  if (puedeDescargar) {
    pasos.push({
      id: 'detalle-descargas',
      title: 'Descargas',
      text: 'Descargue el detalle del proceso o un resumen de los resultados en CSV.',
      attachTo: { element: '[data-tour="detalle-descargas"]', on: 'bottom' },
    });
  }

  if (mostrarTablaDetalles) {
    pasos.push({
      id: 'detalle-filtro-estado',
      title: 'Filtrar registros',
      text: 'Filtre las filas de la planilla según su estado de procesamiento.',
      attachTo: { element: '[data-tour="detalle-filtro-estado"]', on: 'bottom' },
    });
  }

  if (hayRegistrosDetalle) {
    pasos.push({
      id: 'detalle-expandir',
      title: 'Datos originales',
      text: 'Presione esta flecha para ver los datos tal como venían en la planilla original.',
      attachTo: { element: '[data-tour="detalle-expandir"]', on: 'right' },
    });

    pasos.push({
      id: 'detalle-accion',
      title: 'Eliminar registro',
      text: 'Desde aquí puede eliminar esta fila del lote.',
      attachTo: { element: '[data-tour="detalle-accion"]', on: 'left' },
    });
  }

  return pasos;
}
