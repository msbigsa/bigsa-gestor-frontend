import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { HtmlService } from 'src/app/services/html.service';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-doc-html',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconsModule,
    MatNativeDateModule,
    NgScrollbarModule,
  ],
  providers: [DatePipe],
  templateUrl: './list-doc-html.component.html',
  styleUrl: './list-doc-html.component.scss',
})
export class ListDocHtmlComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<ArchivoDoc>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private htmlService = inject(HtmlService);
  private toastr = inject(ToastrService);

  archivosDoc: ArchivoDoc[] = [];

  pageSize = 10;
  totalElements = 0;
  searchText = '';

  displayedColumns: string[] = [
    '#',
    'nombre',
    'nombreDocumento',
    'usrCodigo',
    'fechaSubida',
    'accion',
  ];

  dataSource = new MatTableDataSource<ArchivoDoc>([]);

  constructor(
    public dialog: MatDialog,
    public datePipe: DatePipe,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarDocumentos(): void {
    this.htmlService
      .listarDocumentosPaginado(0, this.pageSize)
      .subscribe((data) => {
        this.dataSource.data = data.content;
        this.totalElements = data.totalElements;

        // Si la vista ya está inicializada
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

        this.table?.renderRows();
      });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  irAGenerarHtml(): void {
    this.router.navigate(['/inicio/html/conversor-doc-html']);
  }

  getFechaCompleta(fecha: Date | string): string {
    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy") ?? '';
  }

  eliminar(documento: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar documento',
        message: `¿Está seguro que desea eliminar "${documento.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.htmlService.eliminar(documento.id).subscribe(() => {
          this.toastr.success('Documento eliminado correctamente', 'Exitoso');
          this.cargarDocumentos();
        });
      }
    });
  }
}
