import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';

@Component({
  selector: 'app-list-doc-html',
  imports: [
        MaterialModule,
        TablerIconsModule,
        MatNativeDateModule,
        NgScrollbarModule,
        CommonModule,
    ],
  templateUrl: './list-doc-html.component.html',
  styleUrl: './list-doc-html.component.scss',
})
export class ListDocHtmlComponent implements AfterViewInit {

  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);

  archivosDoc: ArchivoDoc[];

  searchText: any;
  displayedColumns: string[] = [
    '#',
    'nombre',
    'nombreDocumento',
    'usrCodigo',
    'fechaSubida',
    'accion',
  ];

  //dataSource: MatTableDataSource<ArchivoDoc> | null;
  dataSource: MatTableDataSource<ArchivoDoc> ;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(public dialog: MatDialog, public datePipe: DatePipe) {}

  ngAfterViewInit(): void {
    this.updateDataSource();
  }

  updateDataSource() {
    this.dataSource.paginator = this.paginator;
    //this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string): void {
    //this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
