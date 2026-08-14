import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';

import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { ArchivoDocResultado } from 'src/app/models/ArchivoDocResultado';
import { HtmlDocumentoService } from 'src/app/services/htmlDocumento.service';
import { HtmlDocumentoResultadoService } from 'src/app/services/htmlDocumentoResultado.service';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { DocumentoResumenComponent } from '../shared/components/documento-resumen/documento-resumen.component';
import { HtmlVersionesTableComponent } from '../shared/components/html-versiones-table/html-versiones-table.component';
import { HtmlPreviewDialogComponent } from '../shared/components/html-preview-dialog/html-preview-dialog.component';
import { forkJoin } from 'rxjs';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';

@Component({
  selector: 'app-resultado-doc-html',
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconsModule,
    DocumentoResumenComponent,
    HtmlVersionesTableComponent
  ],
  templateUrl: './resultado-doc-html.component.html',
  styleUrl: './resultado-doc-html.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultadoDocHtmlComponent {

  readonly documento = signal<ArchivoDoc | null>(null);

  readonly resultadosHtml = signal<ArchivoDocResultado[]>([]);

  readonly esUltimoHtml = computed(
    () => this.resultadosHtml().length === 1
  );

  // Reactivo via withComponentInputBinding -- alias porque el resto del componente usa `id` como numero.
  readonly idParam = input.required<string>({ alias: 'id' });
  readonly id = computed(() => Number(this.idParam()));

  private readonly htmlDocumentoService = inject(HtmlDocumentoService);
  private readonly htmlDocumentoResultadoService = inject(HtmlDocumentoResultadoService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const id = this.id();

      untracked(() => {
        if (id) {
          this.documento.set(null);
          this.resultadosHtml.set([]);
          this.cargarDocumento();
        }
      });
    });
  }

  cargarDocumento(): void {
    forkJoin({
      documento: this.htmlDocumentoService.obtener(this.id()),
      htmls: this.htmlDocumentoService.listarHtmlResultado(this.id())
    })
      .subscribe({
        next: ({ documento, htmls }) => {

          this.documento.set(documento);
          this.resultadosHtml.set(htmls);

        },
        error: () => {

          this.documento.set(null);
          this.resultadosHtml.set([]);

        }
      });
  }

  volver(): void {
    this.router.navigate(['/inicio/html/listar-doc-html']);
  }

  descargar(html: ArchivoDocResultado): void {
    this.htmlDocumentoResultadoService.descargarArchivo(html.id!);
  }

  previsualizar(html: ArchivoDocResultado): void {
    this.htmlDocumentoResultadoService.descargarHtml(html.id!).subscribe((data) => {
      this.abrirPreview(html.id!, data.html, html.version!);
    });
  }

  private abrirPreview(id: number, html: string, version: number): void {
    this.dialog.open(HtmlPreviewDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        id,
        html,
        version
      }
    });
  }

  eliminar(html: ArchivoDocResultado): void {
    this.confirmarEliminarHtml(html)
      .subscribe(result => {

        if (result === ConfirmDialogResult.CANCEL) {
          return;
        }

        if (!this.esUltimoHtml()) {
          this.eliminaHtml(html.id!);
          return;
        }

        this.confirmarEliminarUltimaVersion()
          .subscribe(result => {

            if (result === ConfirmDialogResult.CONFIRM_ADDITIONAL) {
              this.eliminaDocumentoCompleto();
            } else if (result === ConfirmDialogResult.CONFIRM) {
              this.eliminaHtml(html.id!);
            }
          });
      });
  }

  private confirmarEliminarHtml(
    html: ArchivoDocResultado
  ) {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar HTML',
        message: `¿Está seguro que desea eliminar el HTML con versión "${html.version}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      },
    }).afterClosed();
  }

  private confirmarEliminarUltimaVersion() {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar HTML',
        message: 'Es la última versión del documento ¿Desea eliminar el registro completo?',
        confirmTextAdic: 'Si',
        confirmText: 'No, sólo HTML',
        cancelText: 'Cancelar',
        useConfirmTextAdic: true
      },
    }).afterClosed();
  }

  eliminaDocumentoCompleto(): void {
    this.htmlDocumentoService.eliminar(this.documento()?.id!).subscribe(() => {
      this.toastr.success(
        'Documento y HTML eliminados correctamente',
        'Exitoso'
      );

      this.router.navigate(['/inicio/html/listar-doc-html']);
    });
  }

  eliminaHtml(id: number): void {
    this.htmlDocumentoResultadoService
      .eliminar(id)
      .subscribe(() => {
        this.toastr.success(
          'HTML eliminado correctamente',
          'Exitoso'
        );

        this.cargarDocumento();
      });
  }

  nuevaVersion(generaNuevaVersion: boolean) {
    if (generaNuevaVersion) {
      this.router.navigate(['/inicio/html/conversor-doc-html/actualizar-doc-html', this.id()]);
    }
  }


}