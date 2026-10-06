import type { StepOptions } from 'shepherd.js';

/**
 * Pasos del tour guiado para el formulario de carga de una planilla de Vida y Salud.
 * Los selectores [data-tour="..."] se marcan en cargar-lote.component.html.
 * Los pasos de agrupación/plantilla solo se incluyen si "Enviar correo" está marcado, ya que esos
 * campos no existen en el DOM cuando está desactivado.
 */
export function buildCargarLoteTourSteps(enviaCorreo: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'carga-compania',
      title: 'Compañía',
      text: 'Busque y seleccione la compañía aseguradora a la que pertenece esta planilla de facturas.',
      attachTo: { element: '[data-tour="carga-compania"]', on: 'bottom' },
    },
    {
      id: 'carga-incluye-pdf',
      title: 'Tipo de carga',
      text: 'Indique si la carga incluye facturas y nóminas (con PDF de respaldo) o es solo una regularización de documento, sin PDF.',
      attachTo: { element: '[data-tour="carga-incluye-pdf"]', on: 'bottom' },
    },
    {
      id: 'carga-envia-correo',
      title: 'Enviar correo',
      text: 'Actívelo si además de facturar quiere enviar un correo con la factura al asegurado. Requiere que la carga incluya PDF.',
      attachTo: { element: '[data-tour="carga-envia-correo"]', on: 'bottom' },
    },
  ];

  if (enviaCorreo) {
    pasos.push(
      {
        id: 'carga-agrupacion',
        title: 'Agrupación del correo',
        text: 'Defina cómo se agrupan las facturas al armar cada correo: por dirección de correo, o por asegurado.',
        attachTo: { element: '[data-tour="carga-agrupacion"]', on: 'bottom' },
      },
      {
        id: 'carga-plantilla',
        title: 'Plantilla de correo',
        text: 'Busque y seleccione la plantilla que se usará para el correo de la factura.',
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
 * Pasos del tour guiado para el listado de lotes de Vida y Salud.
 * Los selectores [data-tour="..."] se marcan en listar-lotes.component.html.
 * El paso de "Cargar nueva planilla" solo se incluye si el usuario tiene acceso a esa pantalla
 * (ver MenuService.tieneAcceso), y el de "Acciones" solo si existen registros en la tabla.
 */
export function buildListarLotesTourSteps(hayRegistros: boolean, puedeCargarLote: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'lote-filtro-estado',
      title: 'Filtrar por estado',
      text: 'Filtre los lotes según su estado (cargado, validado, facturado, con errores, etc.).',
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
      text: 'Presione este botón para subir una nueva planilla de Vida y Salud.',
      attachTo: { element: '[data-tour="lote-cargar"]', on: 'bottom' },
    });
  }

  if (hayRegistros) {
    pasos.push({
      id: 'lote-accion',
      title: 'Acciones del lote',
      text: 'Desde aquí puede ver el detalle, validar, facturar o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="lote-accion"]', on: 'left' },
    });
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el detalle de un lote de Vida y Salud.
 * Los selectores [data-tour="..."] se marcan en detalle-lote.component.html.
 * "Documentos" solo se incluye si el lote incluye PDF (unica condicion para que la seccion exista)
 * -- el paso apunta al header del panel, no a botones internos, porque el panel arranca colapsado y
 * Angular Material no renderiza el contenido interno hasta la primera vez que se abre.
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
      text: 'Aquí puede ver el resumen de filas totales, válidas, con error, facturadas y el estado de los correos.',
      attachTo: { element: '[data-tour="detalle-resumen"]', on: 'bottom' },
    },
  ];

  if (hayAcciones) {
    pasos.push({
      id: 'detalle-acciones',
      title: 'Acciones del lote',
      text: 'Desde aquí puede validar, facturar, cargar una corrección o eliminar el lote, según su estado.',
      attachTo: { element: '[data-tour="detalle-acciones"]', on: 'bottom' },
    });
  }

  if (tieneDocumentos) {
    pasos.push({
      id: 'detalle-documentos',
      title: 'Documentos',
      text: 'Abra esta sección para subir los PDFs de las facturas y los archivos adicionales del correo, procesarlos y revisar el historial de asignaciones.',
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
        text: 'Presione esta flecha para ver los datos originales de la planilla y el resultado de la facturación.',
        attachTo: { element: '[data-tour="detalle-expandir"]', on: 'right' },
      },
      {
        id: 'detalle-accion',
        title: 'Eliminar registro',
        text: 'Desde aquí puede eliminar esta fila del lote (no disponible si ya fue facturada).',
        attachTo: { element: '[data-tour="detalle-accion"]', on: 'left' },
      },
    );
  }

  return pasos;
}
