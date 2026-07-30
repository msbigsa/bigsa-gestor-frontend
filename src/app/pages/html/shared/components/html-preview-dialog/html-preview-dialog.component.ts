import { AfterViewInit, Component, ElementRef, inject, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-html-preview-dialog',
  imports: [
    MaterialModule
  ],
  templateUrl: './html-preview-dialog.component.html',
  styleUrl: './html-preview-dialog.component.scss'
})
export class HtmlPreviewDialogComponent implements AfterViewInit {

  @ViewChild('iframe')
  iframe!: ElementRef<HTMLIFrameElement>;

  version: number = 0;

  private readonly dialogRef = inject(MatDialogRef<HtmlPreviewDialogComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      html: string;
      version: number;
    }
  ) {
    this.version = data.version;
  }

  ngAfterViewInit(): void {

    const doc =
      this.iframe.nativeElement.contentWindow?.document;

    if (doc) {
      doc.open();
      doc.write(this.data.html);
      doc.close();
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}