import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { HtmlService } from 'src/app/services/html.service';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';

@Component({
  selector: 'app-word-html-converter',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FileDropzoneComponent,
  ],
  templateUrl: './word-html-converter.component.html',
  styleUrl: './word-html-converter.component.scss',
})
export class WordHtmlConverterComponent {
  nombre: String = '';
  archivo!: File;

  private htmlService = inject(HtmlService);
  private toastr = inject(ToastrService);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(6)]),
    archivo: new FormControl<File | null>(null, Validators.required),
  });

  get f() {
    return this.form.controls;
  }

  onFileSelected(file: File) {
    this.archivo = file;

    this.form.patchValue({
      archivo: file,
    });

    this.form.get('archivo')?.markAsTouched();
    this.form.get('archivo')?.updateValueAndValidity();
  }

  onFileRemoved() {
    this.archivo = undefined!;

    this.form.patchValue({
      archivo: null,
    });
  }

  generar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    formData.append('nombre', this.form.value.nombre!);
    formData.append('file', this.form.value.archivo!);

    //console.log(formData);

    this.htmlService.docToHtml(formData).subscribe((data) => {
      //console.log(data);

      this.toastr.success('HTML generado correctamente', 'Exitoso');

      const blob = data.body!;

      // Obtener el nombre enviado por Spring
      let fileName = `${this.form.value.nombre}.html`;

      const contentDisposition = data.headers.get('Content-Disposition');

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);

        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Descargar
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }
}
