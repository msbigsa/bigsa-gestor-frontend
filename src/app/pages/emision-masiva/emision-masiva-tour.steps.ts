import type { StepOptions } from 'shepherd.js';

/**
 * Pasos del tour guiado para el formulario de carga de una planilla de emisión masiva.
 * Los selectores [data-tour="..."] se marcan en cargar-lote.component.html.
 * Los pasos de destinatario/llave/plantilla solo se incluyen si "Enviar correo" está marcado,
 * ya que esos campos no existen en el DOM cuando está desactivado.
 */
export function buildCargarLoteTourSteps(enviaCorreo: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'carga-opcion-busqueda',
      title: 'Opción de búsqueda',
      text: 'Indique cómo interpretar la columna A de la planilla: Cotización o Propuesta.',
      attachTo: { element: '[data-tour="carga-opcion-busqueda"]', on: 'bottom' },
    },
    {
      id: 'carga-envia-correo',
      title: 'Enviar correo de confirmación',
      text: 'Actívelo si además de emitir las pólizas quiere enviar un correo de confirmación a los clientes.',
      attachTo: { element: '[data-tour="carga-envia-correo"]', on: 'bottom' },
    },
  ];

  if (enviaCorreo) {
    pasos.push(
      {
        id: 'carga-destinatario',
        title: 'Destinatario del correo',
        text: 'Elija a quién se le envía el correo: contratante, asegurado, o ambos.',
        attachTo: { element: '[data-tour="carga-destinatario"]', on: 'bottom' },
      },
      {
        id: 'carga-llave',
        title: 'Llave de búsqueda de documentos',
        text: 'Define cómo se va a emparejar cada PDF que suba con la fila correspondiente de la planilla.',
        attachTo: { element: '[data-tour="carga-llave"]', on: 'bottom' },
      },
      {
        id: 'carga-plantilla',
        title: 'Plantilla de correo',
        text: 'Busque y seleccione la plantilla de correo que se usará para el aviso de confirmación.',
        attachTo: { element: '[data-tour="carga-plantilla"]', on: 'bottom' },
      },
    );
  }

  pasos.push(
    {
      id: 'carga-archivo',
      title: 'Archivo de la planilla',
      text: 'Arrastre aquí el archivo CSV o Excel (.xlsx) con los datos a cargar, o haga clic para seleccionarlo.',
      attachTo: { element: '[data-tour="carga-archivo"]', on: 'top' },
    },
    {
      id: 'carga-enviar',
      title: 'Cargar planilla',
      text: 'Una vez completados los datos, presione este botón para cargar la planilla.',
      attachTo: { element: '[data-tour="carga-enviar"]', on: 'top' },
    },
  );

  return pasos;
}

/**
 * Pasos del tour guiado para el listado de lotes de emisión masiva.
 * Los selectores [data-tour="..."] se marcan en listar-lotes.component.html.
 * El paso de "Cargar nueva planilla" solo se incluye si el usuario tiene acceso a esa pantalla
 * (ver MenuService.tieneAcceso), y el de "Acciones" solo si existen registros en la tabla.
 */
export function buildListarLotesTourSteps(hayRegistros: boolean, puedeCargarLote: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'lote-filtro-estado',
      title: 'Filtrar por estado',
      text: 'Filtre los lotes según su estado (cargado, validado, emitido, con errores, etc.).',
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
      text: 'Presione este botón para subir una nueva planilla de emisión masiva.',
      attachTo: { element: '[data-tour="lote-cargar"]', on: 'bottom' },
    });
  }

  if (hayRegistros) {
    pasos.push({
      id: 'lote-accion',
      title: 'Acciones del lote',
      text: 'Desde aquí puede ver el detalle, validar, emitir o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="lote-accion"]', on: 'left' },
    });
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el detalle de un lote de emisión masiva.
 * Los selectores [data-tour="..."] se marcan en detalle-lote.component.html.
 * "Documentos" solo se incluye si el lote envía correo (es la única condición para que la seccion
 * exista) -- el paso apunta al header del panel, no a botones internos, porque el panel arranca
 * colapsado y Angular Material no renderiza el contenido interno hasta la primera vez que se abre.
 */
export function buildDetalleLoteTourSteps(
  hayAcciones: boolean,
  tieneDocumentos: boolean,
  mostrarTablaDetalles: boolean,
  hayRegistrosDetalle: boolean,
): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'detalle-resumen',
      title: 'Resumen del lote',
      text: 'Aquí puede ver el resumen de filas totales, válidas, con error, emitidas y el estado de los correos.',
      attachTo: { element: '[data-tour="detalle-resumen"]', on: 'bottom' },
    },
  ];

  if (hayAcciones) {
    pasos.push({
      id: 'detalle-acciones',
      title: 'Acciones del lote',
      text: 'Desde aquí puede validar, emitir, cargar una corrección o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="detalle-acciones"]', on: 'bottom' },
    });
  }

  if (tieneDocumentos) {
    pasos.push({
      id: 'detalle-documentos',
      title: 'Documentos',
      text: 'Abra esta sección para subir los PDFs, procesarlos y revisar el historial de asignaciones.',
      attachTo: { element: '[data-tour="detalle-documentos"]', on: 'bottom' },
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
    pasos.push(
      {
        id: 'detalle-expandir',
        title: 'Datos originales',
        text: 'Presione esta flecha para ver los datos originales de la planilla y el resultado de la emisión.',
        attachTo: { element: '[data-tour="detalle-expandir"]', on: 'right' },
      },
      {
        id: 'detalle-accion',
        title: 'Eliminar registro',
        text: 'Desde aquí puede eliminar esta fila del lote (no disponible si ya fue emitida).',
        attachTo: { element: '[data-tour="detalle-accion"]', on: 'left' },
      },
    );
  }

  return pasos;
}
