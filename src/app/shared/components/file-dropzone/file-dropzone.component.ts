import {
  Component,
  ElementRef,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-file-dropzone',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './file-dropzone.component.html',
  styleUrls: ['./file-dropzone.component.scss'],
})
export class FileDropzoneComponent {
  
  title = input<string>('Seleccione un archivo');
  subtitle = input<string>('Arrastre el archivo aquí o haga clic para seleccionarlo');
  accept = input<string>('*');
  maxSize = input<number>(10 * 1024 * 1024); //10 MB
  fileSelected = output<File>();
  fileRemoved = output<void>();

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  file?: File;

  dragging = false;

  error = '';

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();

    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    this.dragging = false;

    if (!event.dataTransfer?.files.length) {
      return;
    }

    this.processFile(event.dataTransfer.files[0]);
  }

  removeFile(): void {
    this.file = undefined;

    this.fileInput.nativeElement.value = '';

    this.fileRemoved.emit();
  }

  private processFile(file: File): void {
    this.error = '';

    if (file.size > this.maxSize()) {
      this.error = 'El archivo supera el tamaño permitido.';

      return;
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (
      this.accept() !== '*' &&
      !this.accept()
        .split(',')
        .map((x) => x.trim())
        .includes(extension)
    ) {
      this.error = 'Tipo de archivo no permitido.';

      return;
    }

    this.file = file;

    this.fileSelected.emit(file);
  }

  get fileSize(): string {
    if (!this.file) {
      return '';
    }

    return (this.file.size / 1024 / 1024).toFixed(2) + ' MB';
  }
}
