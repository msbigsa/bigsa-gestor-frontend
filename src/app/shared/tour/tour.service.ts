import { Injectable, inject } from '@angular/core';
import { ShepherdService } from 'angular-shepherd';
import type { StepOptions, StepOptionsButton } from 'shepherd.js';

@Injectable({ providedIn: 'root' })
export class TourService {

  private readonly shepherd = inject(ShepherdService);
  private configurado = false;

  /**
   * Inicia un tour con los pasos entregados por el módulo que lo invoca.
   * Cada módulo es responsable de definir sus propios pasos (ver p.ej. html-tour.steps.ts)
   * y de no llamar a start() si el usuario no tiene permiso sobre ese módulo.
   */
  start(steps: StepOptions[]): void {
    if (!steps.length) {
      return;
    }

    this.configurarUnaVez();

    const pasosConBotones = steps.map((step, index) =>
      step.buttons ? step : { ...step, buttons: this.buildButtons(index, steps.length) }
    );

    this.shepherd.addSteps(pasosConBotones);
    this.shepherd.start();
  }

  private configurarUnaVez(): void {
    if (this.configurado) {
      return;
    }

    this.shepherd.defaultStepOptions = {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      arrow: true,
    };
    this.shepherd.modal = true;
    this.shepherd.confirmCancel = false;
    this.configurado = true;
  }

  private buildButtons(index: number, total: number): StepOptionsButton[] {
    const buttons: StepOptionsButton[] = [];

    buttons.push({
      text: 'Omitir',
      classes: 'shepherd-button-secondary',
      action: () => this.shepherd.cancel(),
    });

    if (index > 0) {
      buttons.push({
        text: 'Anterior',
        classes: 'shepherd-button-secondary',
        action: () => this.shepherd.back(),
      });
    }

    const esUltimoPaso = index === total - 1;

    buttons.push({
      text: esUltimoPaso ? 'Finalizar' : 'Siguiente',
      action: () => (esUltimoPaso ? this.shepherd.complete() : this.shepherd.next()),
    });

    return buttons;
  }
}
