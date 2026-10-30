import type { StepOptions } from 'shepherd.js';

/**
 * Pasos del tour guiado para la cola activa.
 * Los selectores [data-tour="..."] se marcan en cola-activa.component.html, sobre el primer grupo.
 * Los pasos del grupo y de las pendientes solo se incluyen si existen.
 */
export function buildColaActivaTourSteps(
  hayGrupo: boolean,
  hayEnEjecucion: boolean,
  hayPendientes: boolean,
  puedeVerHistorial: boolean,
): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'cola-actualizar',
      title: 'Actualizar',
      text: 'La pantalla no se refresca sola: presione aquí para ver el estado actual de la cola.',
      attachTo: { element: '[data-tour="cola-actualizar"]', on: 'bottom' },
    },
  ];

  if (puedeVerHistorial) {
    pasos.push({
      id: 'cola-historial',
      title: 'Historial',
      text: 'Aquí puede ver las cargas que ya salieron de la cola: terminadas, con error o canceladas.',
      attachTo: { element: '[data-tour="cola-historial"]', on: 'bottom' },
    });
  }

  if (hayGrupo) {
    pasos.push({
      id: 'cola-grupo',
      title: 'Grupo de ejecución',
      text: 'Cada grupo ejecuta una sola carga a la vez; las demás esperan su turno en el orden de la lista.',
      attachTo: { element: '[data-tour="cola-grupo"]', on: 'top' },
    });

    pasos.push({
      id: 'cola-en-ejecucion',
      title: 'En ejecución',
      text: hayEnEjecucion
        ? 'La carga que se está ejecutando, quién la pidió y desde cuándo. Si es suya, puede cancelarla: se detiene después de la fila en curso.'
        : 'Aquí aparece la carga que se está ejecutando en este grupo, cuando la hay.',
      attachTo: { element: '[data-tour="cola-en-ejecucion"]', on: 'bottom' },
    });
  }

  if (hayPendientes) {
    pasos.push(
      {
        id: 'cola-posicion',
        title: 'Posición',
        text: 'El orden en que saldrán las cargas que esperan. Un reintento sale primero, y las que están en pausa no tienen posición.',
        attachTo: { element: '[data-tour="cola-posicion"]', on: 'right' },
      },
      {
        id: 'cola-acciones',
        title: 'Reordenar y cancelar',
        text: 'Suba, baje o mueva la carga a otra posición de su grupo. Las que pidió usted también se pueden cancelar.',
        attachTo: { element: '[data-tour="cola-acciones"]', on: 'left' },
      },
    );
  }

  return pasos;
}

/**
 * Pasos del tour guiado para el historial de la cola.
 * Los selectores [data-tour="..."] se marcan en historial-cola.component.html.
 * Los pasos de la tabla solo se incluyen si existen registros.
 */
export function buildHistorialColaTourSteps(hayRegistros: boolean): StepOptions[] {
  const pasos: StepOptions[] = [
    {
      id: 'historial-actualizar',
      title: 'Actualizar',
      text: 'Presione aquí para ver las cargas que terminaron recién.',
      attachTo: { element: '[data-tour="historial-actualizar"]', on: 'bottom' },
    },
  ];

  if (hayRegistros) {
    pasos.push(
      {
        id: 'historial-carga',
        title: 'Carga',
        text: 'Qué se ejecutó. Si tiene acceso al módulo, el enlace lleva al detalle de la carga.',
        attachTo: { element: '[data-tour="historial-carga"]', on: 'right' },
      },
      {
        id: 'historial-estado',
        title: 'Estado',
        text: 'Cómo terminó: finalizada, con error, cancelada o abortada (se reintentó y no se pudo). Pase el mouse para ver el motivo.',
        attachTo: { element: '[data-tour="historial-estado"]', on: 'left' },
      },
    );
  }

  pasos.push({
    id: 'historial-paginador',
    title: 'Páginas',
    text: 'Navegue por el historial y elija cuántas cargas ver por página.',
    attachTo: { element: '[data-tour="historial-paginador"]', on: 'top' },
  });

  return pasos;
}
