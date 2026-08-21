import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';

@Component({
  selector: 'app-documento-resumen',
  imports: [CommonModule, MaterialModule],
  templateUrl: './documento-resumen.component.html',
  styleUrl: './documento-resumen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentoResumenComponent {

  readonly documento = input<ArchivoDoc | null>(null);
  readonly muestraBoton = input<boolean>(true);
  nuevaVersionHtml = output<boolean>();

  nuevaVersion() {
    this.nuevaVersionHtml.emit(true);
  }

}
