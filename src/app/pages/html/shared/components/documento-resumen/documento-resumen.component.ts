import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';

@Component({
  selector: 'app-documento-resumen',
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  templateUrl: './documento-resumen.component.html',
  styleUrl: './documento-resumen.component.scss',
})
export class DocumentoResumenComponent {

  readonly documento = input<ArchivoDoc | null>(null);
  readonly muestraBoton = input<boolean>(true);
  nuevaVersionHtml = output<boolean>();

  nuevaVersion() {
    this.nuevaVersionHtml.emit(true);
  }

}
