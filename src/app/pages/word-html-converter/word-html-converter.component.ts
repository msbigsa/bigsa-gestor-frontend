import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { HtmlService } from 'src/app/services/html.service';

@Component({
  selector: 'app-word-html-converter',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './word-html-converter.component.html',
  styleUrl: './word-html-converter.component.scss',
})
export class WordHtmlConverterComponent {

  nombre: String = '';
  archivoSeleccionado: File | null = null;

  private htmlService = inject(HtmlService);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(6)]),
    archivo: new FormControl<File | null>(null, Validators.required)
  });

  get f() {
    return this.form.controls;
  }
      
  selectFile(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.archivoSeleccionado = input.files[0];

    this.form.patchValue({
      archivo: this.archivoSeleccionado
    });

    this.form.get('archivo')?.updateValueAndValidity();
  }

  generar() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    formData.append('nombre', this.form.value.nombre!);
    formData.append('file', this.form.value.archivo!);

    console.log(formData);

    this.htmlService.docToHtml(formData).subscribe(data => {
      console.log(data);
    });
    
  }
}
