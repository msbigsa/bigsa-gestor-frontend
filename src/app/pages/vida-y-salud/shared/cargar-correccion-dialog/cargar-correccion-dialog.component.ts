import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';
import { VidaSaludLoteService } from 'src/app/services/vida-y-salud/vidaSaludLote.service';
import { LoteVidaSaludConfirmacion } from 'src/app/models/vida-y-salud/LoteVidaSaludConfirmacion';

export interface CargarCorreccionDialogData {
  loteOrigenId: number;
  nombreArchivoOrigen: string;
}

@Component({
  selector: 'app-cargar-correccion-dialog-vida-salud',
  imports: [MaterialModule, FileDropzoneComponent],
  templateUrl: './cargar-correccion-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargarCorreccionDialogVidaSaludComponent {

  private readonly loteService = inject(VidaSaludLoteService);
  private readonly dialogRef = inject(MatDialogRef<CargarCorreccionDialogVidaSaludComponent, LoteVidaSaludConfirmacion | undefined>);

  readonly archivo = signal<File | null>(null);
  readonly cargando = signal(false);

  readonly puedeSubir = computed(() => this.archivo() !== null && !this.cargando());

  constructor(@Inject(MAT_DIALOG_DATA) public data: CargarCorreccionDialogData) { }

  onArchivoSeleccionado(file: File): void {
    this.archivo.set(file);
  }

  onArchivoRemovido(): void {
    this.archivo.set(null);
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  subir(): void {
    if (!this.puedeSubir()) {
      return;
    }

    this.cargando.set(true);

    this.loteService.cargarCorreccion(this.data.loteOrigenId, this.archivo()!).subscribe({
      next: confirmacion => this.dialogRef.close(confirmacion),
      error: () => this.cargando.set(false),
    });
  }
}
