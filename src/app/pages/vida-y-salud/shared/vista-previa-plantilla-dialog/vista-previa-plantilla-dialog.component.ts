import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { MaterialModule } from 'src/app/material.module';
import { VidaSaludFormatoService } from 'src/app/services/vida-y-salud/vidaSaludFormato.service';
import { PlantillaContenido } from 'src/app/models/vida-y-salud/PlantillaContenido';

export interface VistaPreviaPlantillaDialogData {
  formCodigo: number;
  // true: se muestra "Cancelar"/"Continuar" (paso obligatorio antes de cargar). false/omitido: solo
  // "Cerrar" (revision posterior desde detalle-lote, sin ninguna accion asociada).
  modoConfirmacion?: boolean;
}

// Replica el modal "Desea utilizar este formato?" del legacy (sin el boton de prueba, que se decidio
// no migrar) -- el contenido se consulta en el momento, no se recibe pre-cargado.
@Component({
  selector: 'app-vista-previa-plantilla-dialog',
  imports: [CommonModule, MaterialModule],
  templateUrl: './vista-previa-plantilla-dialog.component.html',
  styleUrl: './vista-previa-plantilla-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VistaPreviaPlantillaDialogComponent {

  private readonly formatoService = inject(VidaSaludFormatoService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialogRef = inject(MatDialogRef<VistaPreviaPlantillaDialogComponent, boolean | undefined>);

  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly plantilla = signal<PlantillaContenido | null>(null);
  readonly cargado = signal(false);

  cuerpoSrcdoc: SafeHtml = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: VistaPreviaPlantillaDialogData) {
    this.formatoService.previsualizar(data.formCodigo).subscribe({
      next: contenido => {
        this.plantilla.set(contenido);
        this.cuerpoSrcdoc = this.sanitizer.bypassSecurityTrustHtml(contenido.body);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  onIframeLoad(): void {
    this.cargado.set(true);
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  continuar(): void {
    this.dialogRef.close(true);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
