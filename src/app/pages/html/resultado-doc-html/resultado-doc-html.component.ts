import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
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
import { FileDropzoneComponent } from 'src/app/shared/components/file-dropzone/file-dropzone.component';

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

  htmls: ArchivoDocResultado[] = [];

  id = 0;

  private htmlDocumentoService = inject(HtmlDocumentoService);
  private htmlDocumentoResultadoService = inject(
    HtmlDocumentoResultadoService
  );
  private readonly toastr = inject(ToastrService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.route.params.subscribe((data) => {
      this.id = Number(data['id']);

      this.cargarDocumento();
    });
  }

  ngOnInit(): void {}

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
        this.htmls = data;
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
      this.router.navigate([`/inicio/html/actualizar-doc-html/${this.id}`]);
    }
  }
}