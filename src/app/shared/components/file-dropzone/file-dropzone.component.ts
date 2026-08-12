import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-file-dropzone',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './file-dropzone.component.html',
  styleUrls: ['./file-dropzone.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileDropzoneComponent {

  private readonly toastr = inject(ToastrService);

  title = input<string>('Seleccione un archivo');
  subtitle = input<string>('Arrastre el archivo aquí o haga clic para seleccionarlo');
  accept = input<string>('*');
  maxSize = input<number>(10 * 1024 * 1024); //10 MB
  fileSelected = output<File>();
  fileRemoved = output<void>();

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  readonly file = signal<File | undefined>(undefined);

  readonly dragging = signal(false);

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

    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();

    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    this.dragging.set(false);

    if (!event.dataTransfer?.files.length) {
      return;
    }

    this.processFile(event.dataTransfer.files[0]);
  }

  removeFile(): void {
    this.file.set(undefined);

    this.fileInput.nativeElement.value = '';

    this.fileRemoved.emit();
  }

  private processFile(file: File): void {
    if (file.size === 0) {
      this.toastr.error('El archivo está vacío.', 'Error');

      return;
    }

    if (file.size > this.maxSize()) {
      this.toastr.error('El archivo supera el tamaño permitido.', 'Error');

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
      this.toastr.error('Tipo de archivo no permitido.', 'Error');

      return;
    }

    this.file.set(file);

    this.fileSelected.emit(file);
  }

  get fileSize(): string {
    const file = this.file();

    if (!file) {
      return '';
    }

    return (file.size / 1024 / 1024).toFixed(2) + ' MB';
  }
}
