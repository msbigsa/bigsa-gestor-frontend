import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Input,
  ViewChild,
  inject,
  output,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from 'src/app/material.module';
import { ArchivoDocResultado } from 'src/app/models/ArchivoDocResultado';

@Component({
  selector: 'app-html-versiones-table',
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  providers: [DatePipe],
  templateUrl: './html-versiones-table.component.html',
  styleUrl: './html-versiones-table.component.scss',
})
export class HtmlVersionesTableComponent implements AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  descargarHtml = output<ArchivoDocResultado>();  
  previsualizarHtml = output<ArchivoDocResultado>();  
  eliminarHtml = output<ArchivoDocResultado>();

  @Input()
  set resultadosHtml(value: ArchivoDocResultado[]) {
    this.dataSource.data = value ?? [];
  }

  private readonly datePipe = inject(DatePipe);

  dataSource = new MatTableDataSource<ArchivoDocResultado>([]);

  readonly displayedColumns: string[] = [
    '#',
    'version',
    'usrCodigo',
    'usrNombre',
    'fechaCreacion',
    'accion',
  ];

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  getFechaCompleta(fecha: Date | string): string {
    return (
      this.datePipe.transform(
        fecha,
        "EEEE, d 'de' MMMM 'de' yyyy"
      ) ?? ''
    );
  }

  descargar(html: ArchivoDocResultado): void {
    this.descargarHtml.emit(html);
  }

  previsualizar(html: ArchivoDocResultado): void {
    this.previsualizarHtml.emit(html);
  }

  eliminar(html: ArchivoDocResultado): void {
    this.eliminarHtml.emit(html);
  }

}
