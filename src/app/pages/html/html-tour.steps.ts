import type { StepOptions } from 'shepherd.js';

/**
 * Pasos del tour guiado para el listado de documentos HTML.
 * Los selectores [data-tour="..."] se marcan en list-doc-html.component.html.
 * El paso de "Generar HTML" solo se incluye si el usuario tiene acceso a esa pantalla
 * (ver MenuService.tieneAcceso), y el de "Acción" solo si existen registros en la tabla.
 */
export function buildListDocHtmlTourSteps(hayRegistros: boolean, puedeGenerarHtml: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'doc-filtro',
      title: 'Buscar documentos',
      text: 'Filtre los documentos por nombre, documento o usuario.',
      attachTo: { element: '[data-tour="doc-filtro"]', on: 'bottom' },
    },
  ];

  if (puedeGenerarHtml) {
    pasos.push({
      id: 'doc-generar',
      title: 'Generar HTML',
      text: 'Presione este botón para subir un nuevo documento Word y convertirlo a HTML.',
      attachTo: { element: '[data-tour="doc-generar"]', on: 'bottom' },
    });
  }

  if (hayRegistros) {
    pasos.push({
      id: 'doc-accion',
      title: 'Acciones del registro',
      text: 'Desde aquí puede revisar el HTML generado o eliminar el documento.',
      attachTo: { element: '[data-tour="doc-accion"]', on: 'left' },
    });
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el detalle de un documento HTML.
 * Los selectores [data-tour="..."] se marcan en documento-resumen.component.html
 * y html-versiones-table.component.html.
 * El paso de "Acción" solo se incluye si existen versiones HTML generadas.
 */
export function buildResultadoDocHtmlTourSteps(hayRegistros: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'resultado-resumen',
      title: 'Resumen del documento',
      text: 'Aquí puede ver el usuario que cargó el documento, la fecha de carga, la última versión generada y la fecha de la última generación.',
      attachTo: { element: '[data-tour="resultado-resumen"]', on: 'bottom' },
    },
    {
      id: 'resultado-nueva-version',
      title: 'Generar nueva versión',
      text: 'Presione este botón para subir un nuevo Word y generar una nueva versión del HTML de este documento.',
      attachTo: { element: '[data-tour="resultado-nueva-version"]', on: 'bottom' },
    },
  ];

  if (hayRegistros) {
    pasos.push({
      id: 'resultado-accion',
      title: 'Acciones de la versión',
      text: 'Desde aquí puede descargar el HTML, previsualizarlo o eliminar esa versión.',
      attachTo: { element: '[data-tour="resultado-accion"]', on: 'left' },
    });
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el formulario de conversión Word a HTML.
 * Los selectores [data-tour="..."] se marcan en word-html-converter.component.html.
 * El layout cambia una vez subido el documento (se oculta el área de carga y
 * aparecen nuevos botones), por lo que los pasos se arman según ese estado.
 */
export function buildWordHtmlConverterTourSteps(
  subido: boolean,
  esActualizacion: boolean
): StepOptions[] {
  if (!subido) {
    return [
      {
        id: 'conversor-nombre',
        title: 'Paso 1: Nombre',
        text: 'Primero coloque un nombre para identificar el documento.',
        attachTo: { element: '[data-tour="conversor-nombre"]', on: 'bottom' },
      },
      {
        id: 'conversor-archivo',
        title: 'Paso 2: Adjuntar archivo',
        text: 'Luego adjunte el archivo Word (.doc o .docx) arrastrándolo o haciendo clic para seleccionarlo.',
        attachTo: { element: '[data-tour="conversor-archivo"]', on: 'bottom' },
      },
      {
        id: 'conversor-generar',
        title: 'Paso 3: Generar HTML',
        text: 'Finalmente presione el botón "Generar HTML" para convertir el documento.',
        attachTo: { element: '[data-tour="conversor-generar"]', on: 'top' },
      },
    ];
  }

  const pasos: StepOptions[] = [
    {
      id: 'conversor-nombre',
      title: 'Nombre del documento',
      text: 'Este es el nombre con el que se identifica el documento generado.',
      attachTo: { element: '[data-tour="conversor-nombre"]', on: 'bottom' },
    },
    {
      id: 'conversor-ver-documento',
      title: 'Ver documento generado',
      text: 'Presione este botón para ver el HTML recién generado.',
      attachTo: { element: '[data-tour="conversor-ver-documento"]', on: 'top' },
    },
  ];

  if (!esActualizacion) {
    pasos.push({
      id: 'conversor-nuevo-html',
      title: 'Generar nuevo HTML',
      text: 'Presione este botón para subir otro documento Word y generar un nuevo HTML.',
      attachTo: { element: '[data-tour="conversor-nuevo-html"]', on: 'top' },
    });
  }

  return pasos;
}
