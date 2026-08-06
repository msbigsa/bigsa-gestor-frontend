import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MaterialModule } from 'src/app/material.module';
import { HtmlDocumentoResultadoService } from 'src/app/services/htmlDocumentoResultado.service';

@Component({
  selector: 'app-html-preview-dialog',
  imports: [
    MaterialModule
  ],
  templateUrl: './html-preview-dialog.component.html',
  styleUrl: './html-preview-dialog.component.scss'
})
export class HtmlPreviewDialogComponent {

  version: number = 0;

  loaded = false;

  htmlSrcdoc: SafeHtml;

  private readonly dialogRef = inject(MatDialogRef<HtmlPreviewDialogComponent>);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly htmlDocumentoResultadoService = inject(HtmlDocumentoResultadoService);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id: number;
      html: string;
      version: number;
    }
  ) {
    this.version = data.version;
    this.htmlSrcdoc = this.sanitizer.bypassSecurityTrustHtml(data.html);
  }

  onIframeLoad(event: Event): void {
    const doc = (event.target as HTMLIFrameElement).contentDocument;

    if (doc) {
      const body = doc.body;

      body.style.margin = '20px';
      body.style.boxSizing = 'border-box';
      body.style.overflowX = 'hidden';

      doc.documentElement.style.height = 'auto';
      doc.documentElement.style.overflowX = 'hidden';
      body.style.height = 'auto';

      const style = doc.createElement('style');
      style.textContent = `
        img, table { max-width: 100% !important; }
      `;
      doc.head.appendChild(style);
    }

    this.loaded = true;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  descargar(): void {
    this.htmlDocumentoResultadoService.descargarArchivo(this.data.id);
  }
}