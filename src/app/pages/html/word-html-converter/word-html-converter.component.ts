import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { HtmlDoc } from 'src/app/models/HtmlDoc';
import { HtmlService } from 'src/app/services/html.service';
import { HtmlDocumentoService } from 'src/app/services/htmlDocumento.service';
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';
import { DocumentoResumenComponent } from '../shared/components/documento-resumen/documento-resumen.component';

@Component({
  selector: 'app-word-html-converter',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FileDropzoneComponent,
    DocumentoResumenComponent
  ],
  templateUrl: './word-html-converter.component.html',
  styleUrl: './word-html-converter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordHtmlConverterComponent {

  readonly archivo = signal<File | null>(null);

  readonly htmlDoc = signal<HtmlDoc | null>(null);
  readonly subido = signal(false);

  // Reactivo via withComponentInputBinding -- alias porque el resto del componente usa `id` como numero.
  readonly idParam = input<string>(undefined, { alias: 'id' });
  readonly id = computed(() => Number(this.idParam() ?? 0));
  readonly esActualizacion = computed(() => this.id() > 0);

  readonly documento = signal<ArchivoDoc | null>(null);

  private readonly htmlService = inject(HtmlService);
  private readonly htmlDocumentoService = inject(HtmlDocumentoService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const id = this.id();

      untracked(() => {
        if (id) {
          this.cargarDocumento();
        }
      });
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

    this.documento.set(null);

    this.htmlDocumentoService.obtener(this.id()).subscribe((data) => {
      this.documento.set(data);

      this.form.patchValue({
        nombre: data.nombre
      });

      this.form.get('nombre')?.disable();
    });
  }

  onFileSelected(file: File) {
    this.archivo.set(file);

    this.form.patchValue({
      archivo: file,
    });

    this.form.get('archivo')?.markAsTouched();
    this.form.get('archivo')?.updateValueAndValidity();
  }

  onFileRemoved() {
    this.archivo.set(null);

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

    const request$ = this.esActualizacion()
      ? this.htmlService.actualizaDocToHtml(formData, this.id())
      : this.htmlService.docToHtml(formData);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.htmlDoc.set(data);

        this.toastr.success(
          this.esActualizacion()
            ? 'HTML actualizado correctamente'
            : 'HTML generado correctamente',
          'Exitoso'
        );

        if (this.esActualizacion()) {
          this.cargarDocumento();
        }

        this.form.disable();
        this.subido.set(true);
      });
  }

  muestraDocumento(): void {

    if (!this.htmlDoc()?.idDocumento) {
      return;
    }

    this.router.navigate([
      '/inicio/html/resultado-doc-html',
      this.htmlDoc()?.idDocumento
    ]);
  }

  generarNuevoHtml() {
    this.form.reset();
    this.form.enable();

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.subido.set(false);
    this.htmlDoc.set(null);
  }

  volver() {
     this.router.navigate(['/inicio/html/resultado-doc-html', this.id()]);
  }
}
