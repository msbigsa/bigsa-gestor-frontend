import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { HtmlDoc } from 'src/app/models/HtmlDoc';
import { HtmlService } from 'src/app/services/html.service';
import { HtmlDocumentoService } from 'src/app/services/htmlDocumento.service';
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
  subido: boolean = false;

  htmlDoc: HtmlDoc | null = null;

  id = 0;
  documento: ArchivoDoc | null = null;

  private htmlService = inject(HtmlService);
  private htmlDocumentoService = inject(HtmlDocumentoService);
  private toastr = inject(ToastrService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
     this.route.params.subscribe((data) => {
      this.id = Number(data['id']);

      this.cargarDocumento();
    });
  }

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(6)]),
    archivo: new FormControl<File | null>(null, Validators.required),
  });

  get f() {
    return this.form.controls;
  }

  cargarDocumento(): void {
    this.htmlDocumentoService.obtener(this.id).subscribe((data) => {
      this.documento = data;
      //console.log(this.documento);

      this.form.patchValue({
        nombre: this.documento.nombre,
      });
    });
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

    if (this.id > 0) {
      this.htmlService.actualizaDocToHtml(formData, this.id).subscribe((data) => {
      //console.log(data);
        this.htmlDoc = data;

        this.toastr.success('HTML actualizado correctamente', 'Exitoso');

        this.form.disable();
        this.subido = true;

      }); 
    } else {
      this.htmlService.docToHtml(formData).subscribe((data) => {
      //console.log(data);
        this.htmlDoc = data;

        this.toastr.success('HTML generado correctamente', 'Exitoso');

        this.form.disable();
        this.subido = true;

      }); 
    }
    
  }

  muestraDocumento() {
    const url = `/inicio/html/resultado-doc-html/${this.htmlDoc?.idDocumento}`;
    //console.log(url);
    this.router.navigate([url]);
  }

  generarNuevoHtml() {
    this.form.reset();
    this.form.enable();
    this.subido = false;
    this.htmlDoc = null;
  }
}
