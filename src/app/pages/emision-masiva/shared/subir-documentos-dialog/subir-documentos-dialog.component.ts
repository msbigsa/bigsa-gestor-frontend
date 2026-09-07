import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';
import { EmisionMasivaDocumentosService } from 'src/app/services/emision-masiva/emisionMasivaDocumentos.service';
import { CargaArchivosResponse } from 'src/app/models/emision-masiva/CargaArchivosResponse';

export interface SubirDocumentosDialogData {
  loteId: number;
}

@Component({
  selector: 'app-subir-documentos-dialog',
  imports: [MaterialModule, FileDropzoneComponent],
  templateUrl: './subir-documentos-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubirDocumentosDialogComponent {

  private readonly documentosService = inject(EmisionMasivaDocumentosService);
  private readonly dialogRef = inject(MatDialogRef<SubirDocumentosDialogComponent, CargaArchivosResponse | undefined>);

  readonly archivo = signal<File | null>(null);
  readonly cargando = signal(false);

  readonly puedeSubir = computed(() => this.archivo() !== null && !this.cargando());

  constructor(@Inject(MAT_DIALOG_DATA) public data: SubirDocumentosDialogData) { }

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

    this.documentosService.subirDocumentos(this.data.loteId, this.archivo()!).subscribe({
      next: respuesta => this.dialogRef.close(respuesta),
      error: () => this.cargando.set(false),
    });
  }
}
