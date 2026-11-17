import type { StepOptions } from 'shepherd.js';

// Lo que esta visible en la pantalla de carga: el tour solo apunta a esos controles.
export interface PantallaCargaTour {
  hayTipo: boolean;
  permiteMultiplesCompanias: boolean;
  companiaUnica: boolean;
  mostrarPlan: boolean;
  mostrarMoneda: boolean;
  mostrarEmision: boolean;
  mostrarNuevosIntermediarios: boolean;
  mostrarIntermediarios: boolean;
}

/**
 * Pasos del tour guiado para el formulario de carga de una planilla de Carga Masiva Genérica.
 * Los selectores [data-tour="..."] se marcan en cargar-lote.component.html.
 * Los parámetros solo existen con un tipo elegido, y los de compañía única sin "Múltiples Compañías".
 */
export function buildCargarLoteTourSteps(pantalla: PantallaCargaTour): StepOptions[] {
  const { hayTipo, permiteMultiplesCompanias, companiaUnica } = pantalla;
  const pasos: StepOptions[] = [
    {
      id: 'carga-tipo',
      title: 'Tipo de carga',
      text: 'Seleccione el tipo de carga. Según el tipo cambian los parámetros que se piden y el formato de la planilla.',
      attachTo: { element: '[data-tour="carga-tipo"]', on: 'bottom' },
    },
  ];

  if (!hayTipo) {
    return pasos;
  }

  if (permiteMultiplesCompanias) {
    pasos.push({
      id: 'carga-multiples-companias',
      title: 'Múltiples Compañías',
      text: 'Márquelo si cada fila de la planilla trae su propia compañía, negocio, ramo y demás parámetros. Desmárquelo para definirlos aquí, iguales para todas las filas.',
      attachTo: { element: '[data-tour="carga-multiples-companias"]', on: 'bottom' },
    });
  }

  if (companiaUnica) {
    pasos.push({
      id: 'carga-compania',
      title: 'Datos generales',
      text: 'Busque la compañía y complete el negocio, el ramo y los demás datos que aplican a todas las filas.',
      attachTo: { element: '[data-tour="carga-compania"]', on: 'bottom' },
    });

    if (pantalla.mostrarPlan) {
      pasos.push({
        id: 'carga-plan',
        title: 'Plan de cobertura',
        text: 'Elija el plan de cobertura (requiere compañía, negocio y ramo) o marque que se use el indicado en cada fila de la planilla. Elegir uno desmarca el otro.',
        attachTo: { element: '[data-tour="carga-plan"]', on: 'bottom' },
      });
    }

    if (pantalla.mostrarMoneda) {
      pasos.push({
        id: 'carga-moneda',
        title: 'Moneda',
        text: 'Elija la moneda o marque que se use la indicada en cada fila de la planilla. Elegir una desmarca la otra.',
        attachTo: { element: '[data-tour="carga-moneda"]', on: 'bottom' },
      });
    }

    if (pantalla.mostrarNuevosIntermediarios) {
      pasos.push({
        id: 'carga-nuevos-intermediarios',
        title: 'Nuevo organizador / cobrador',
        text: 'Márquelos para reemplazar al organizador o al cobrador de la póliza por el que elija aquí, con su %. Se habilitan con compañía, negocio y ramo elegidos; si el % queda en 0, se le preguntará antes de cargar.',
        attachTo: { element: '[data-tour="carga-nuevos-intermediarios"]', on: 'bottom' },
      });
    }

    if (pantalla.mostrarIntermediarios) {
      pasos.push({
        id: 'carga-intermediarios',
        title: 'Intermediarios',
        text: 'Elija el productor (obligatorio) y los demás intermediarios. Al elegir uno se proponen su % y «aplica sobre» programados en BO; si cambia un % propuesto, se le pide confirmar.',
        attachTo: { element: '[data-tour="carga-intermediarios"]', on: 'bottom' },
      });
    }

    if (pantalla.mostrarEmision) {
      pasos.push({
        id: 'carga-emision',
        title: 'Emisión',
        text: 'Marque si los documentos deben quedar emitidos y elija si las fechas de emisión y recepción se ingresan aquí o se toman de cada fila de la planilla.',
        attachTo: { element: '[data-tour="carga-emision"]', on: 'bottom' },
      });
    }

    pasos.push({
      id: 'carga-forma-pago',
      title: 'Forma de pago',
      text: 'Defina si el pago es automático, el plan y la forma de pago, o si se toman de la planilla.',
      attachTo: { element: '[data-tour="carga-forma-pago"]', on: 'bottom' },
    });
  }

  pasos.push(
    {
      id: 'carga-archivo',
      title: 'Archivo de la planilla',
      text: 'Arrastre aquí el archivo Excel (.xlsx) o CSV con los datos a cargar, o haga clic para seleccionarlo.',
      attachTo: { element: '[data-tour="carga-archivo"]', on: 'top' },
    },
    {
      id: 'carga-enviar',
      title: 'Cargar planilla',
      text: 'Una vez completados los datos, presione este botón para cargar la planilla. Abajo se indica lo que falta, si falta algo.',
      attachTo: { element: '[data-tour="carga-enviar"]', on: 'top' },
    },
  );

  return pasos;
}

/**
 * Pasos del tour guiado para el listado de lotes de Carga Masiva Genérica.
 * Los selectores [data-tour="..."] se marcan en listar-lotes.component.html.
 * El paso de "Cargar nueva planilla" solo se incluye si el usuario tiene acceso a esa pantalla
 * (ver MenuService.tieneAcceso), y el de "Acciones" solo si existen registros en la tabla.
 */
export function buildListarLotesTourSteps(hayRegistros: boolean, puedeCargarLote: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'lote-filtro-tipo',
      title: 'Filtrar por tipo de carga',
      text: 'Filtre los lotes según el tipo de carga.',
      attachTo: { element: '[data-tour="lote-filtro-tipo"]', on: 'bottom' },
    },
    {
      id: 'lote-filtro-estado',
      title: 'Filtrar por estado',
      text: 'Filtre los lotes según su estado (cargado, validado, en cola, ejecutado, cancelado, con errores, etc.).',
      attachTo: { element: '[data-tour="lote-filtro-estado"]', on: 'bottom' },
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
      text: 'Presione este botón para subir una nueva planilla de Carga Masiva Genérica.',
      attachTo: { element: '[data-tour="lote-cargar"]', on: 'bottom' },
    });
  }

  if (hayRegistros) {
    pasos.push({
      id: 'lote-accion',
      title: 'Acciones del lote',
      text: 'Desde aquí puede ver el detalle, validar, ejecutar, cancelar la ejecución o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="lote-accion"]', on: 'left' },
    });
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el detalle de un lote de Carga Masiva Genérica.
 * Los selectores [data-tour="..."] se marcan en detalle-lote.component.html.
 * El filtro y las filas no existen en un lote eliminado.
 */
export function buildDetalleLoteTourSteps(
  mostrarTablaDetalles: boolean,
  hayRegistrosDetalle: boolean,
  hayPagoExistente: boolean,
): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'detalle-resumen',
      title: 'Resumen del lote',
      text: 'Aquí puede ver el resumen de filas totales, válidas, con error y cargadas, y las pólizas que quedaron sin cerrar, si las hay.',
      attachTo: { element: '[data-tour="detalle-resumen"]', on: 'bottom' },
    },
    {
      id: 'detalle-acciones',
      title: 'Acciones del lote',
      text: 'Desde aquí puede validar, ejecutar, cancelar la ejecución, ver el lote en la cola, cargar una corrección o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="detalle-acciones"]', on: 'bottom' },
    },
  ];

  if (mostrarTablaDetalles) {
    pasos.push({
      id: 'detalle-filtro-estado',
      title: 'Filtrar registros',
      text: 'Filtre las filas de la planilla según su estado. Al pasar el mouse o hacer clic en el estado de una fila con error, se ven sus motivos.',
      attachTo: { element: '[data-tour="detalle-filtro-estado"]', on: 'bottom' },
    });
  }

  if (hayPagoExistente) {
    pasos.push({
      id: 'detalle-pago-existente',
      title: 'Pago del documento existente',
      text: 'Una fila rechazada porque su documento ya existía puede igual pagar ese documento si está impago. La fila sigue rechazada; aquí se ve solo el resultado de ese pago.',
      attachTo: { element: '[data-tour="detalle-pago-existente"]', on: 'bottom' },
    });
  }

  if (hayRegistrosDetalle) {
    pasos.push({
      id: 'detalle-accion',
      title: 'Eliminar registro',
      text: 'Desde aquí puede eliminar esta fila del lote (no disponible mientras el lote está en proceso).',
      attachTo: { element: '[data-tour="detalle-accion"]', on: 'left' },
    });
  }

  return pasos;
}
