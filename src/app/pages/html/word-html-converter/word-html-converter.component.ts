import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from '@angular/forms';
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
export class WordHtmlConverterComponent implements OnInit {

  archivo!: File;
  
  htmlDoc: HtmlDoc | null = null;
  subido: boolean = false;

  id = 0;
  documento: ArchivoDoc | null = null;

  private readonly htmlService = inject(HtmlService);
  private readonly htmlDocumentoService = inject(HtmlDocumentoService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(params => {
        const id = Number(params.get('id'));

        if (id) {
          this.id = id;
          this.cargarDocumento();
        }
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
        nombre: this.documento.nombre
      });

      this.form.get('nombre')?.disable();
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

  private crearFormData(): FormData {

    const formData = new FormData();

    formData.append('nombre', this.form.value.nombre!);
    formData.append('file', this.form.value.archivo!);
    //console.log(formData);
    return formData;
  }

  generar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.crearFormData();

    const esActualizacion = this.id > 0;

    const request$ = esActualizacion
      ? this.htmlService.actualizaDocToHtml(formData, this.id)
      : this.htmlService.docToHtml(formData);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.htmlDoc = data;

        this.toastr.success(
          esActualizacion
            ? 'HTML actualizado correctamente'
            : 'HTML generado correctamente',
          'Exitoso'
        );

        this.form.disable();
        this.subido = true;
      });
  }

  muestraDocumento(): void {

    if (!this.htmlDoc?.idDocumento) {
      return;
    }

    this.router.navigate([
      '/inicio/html/resultado-doc-html',
      this.htmlDoc.idDocumento
    ]);
  }

  generarNuevoHtml() {
    this.form.reset();
    this.form.enable();

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.subido = false;
    this.htmlDoc = null;
  }
}
