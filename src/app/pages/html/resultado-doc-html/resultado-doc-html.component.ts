import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { ArchivoDocResultado } from 'src/app/models/ArchivoDocResultado';
import { HtmlDocumentoService } from 'src/app/services/htmlDocumento.service';
import { HtmlDocumentoResultadoService } from 'src/app/services/htmlDocumentoResultado.service';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { DocumentoResumenComponent } from '../shared/components/documento-resumen/documento-resumen.component';
import { HtmlVersionesTableComponent } from '../shared/components/html-versiones-table/html-versiones-table.component';
import { HtmlPreviewDialogComponent } from '../shared/components/html-preview-dialog/html-preview-dialog.component';

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
})
export class ResultadoDocHtmlComponent implements OnInit {
  documento: ArchivoDoc | null = null;

  resultadosHtml: ArchivoDocResultado[] = [];

  id = 0;

  private readonly htmlDocumentoService = inject(HtmlDocumentoService);
  private readonly htmlDocumentoResultadoService = inject(HtmlDocumentoResultadoService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
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

  cargarDocumento(): void {
    this.htmlDocumentoService.obtener(this.id).subscribe((data) => {
      this.documento = data;
    });

    this.cargarHtmls();
  }

  cargarHtmls(): void {
    this.htmlDocumentoService
      .listarHtmlResultado(this.id)
      .subscribe((data) => {
        console.log(data);
        this.resultadosHtml = data;
      });
  }

  volver(): void {
    this.router.navigate(['/inicio/html/listar-doc-html']);
  }

  descargar(html: ArchivoDocResultado): void {
    this.htmlDocumentoResultadoService
      .descargar(html.id!)
      .subscribe((response) => {
        const blob = response.body!;

        const contentDisposition =
          response.headers.get('Content-Disposition');

        let nombreArchivo = 'archivo.zip';

        if (contentDisposition) {
          const match = contentDisposition.match(
            /filename="?([^"]+)"?/
          );

          if (match) {
            nombreArchivo = match[1];
          }
        }

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();

        window.URL.revokeObjectURL(url);
      });
  }

  previsualizar(html: ArchivoDocResultado): void {
    this.htmlDocumentoResultadoService.descargarHtml(html.id!).subscribe((data) => {
      this.abrirPreview(data.html);
    });
  }

  private abrirPreview(html: string): void {
    this.dialog.open(HtmlPreviewDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      height: '90vh',
      data: { html }
    });
  }

  eliminar(html: ArchivoDocResultado): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar HTML',
        message: `¿Está seguro que desea eliminar el HTML con versión "${html.version}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }

      this.htmlDocumentoResultadoService
        .eliminar(html.id!)
        .subscribe(() => {
          this.toastr.success(
            'HTML eliminado correctamente',
            'Exitoso'
          );

          this.cargarHtmls();
        });
    });
  }

  nuevaVersion(generaNuevaVersion: boolean) {
    if (generaNuevaVersion) {
      this.router.navigate(['/inicio/html/actualizar-doc-html', this.id]);
    }
  }

  
}