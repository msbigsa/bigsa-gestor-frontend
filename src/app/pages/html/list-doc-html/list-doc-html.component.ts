import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from 'src/app/material.module';
import { ArchivoDoc } from 'src/app/models/ArchivoDoc';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { HtmlDocumentoService } from 'src/app/services/htmlDocumento.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-list-doc-html',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatPaginatorModule,
    TablerIconsModule,
    MatNativeDateModule,
    NgScrollbarModule,
    ReactiveFormsModule
  ],
  providers: [DatePipe],
  templateUrl: './list-doc-html.component.html',
  styleUrl: './list-doc-html.component.scss',
})
export class ListDocHtmlComponent implements OnInit {

  private readonly htmlDocumentoService = inject(HtmlDocumentoService);
  private readonly toastr = inject(ToastrService);
  private readonly dialog =  inject(MatDialog);
  private readonly datePipe = inject(DatePipe);
  private readonly router = inject(Router);

  readonly documentos = signal<ArchivoDoc[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtro = signal('');

  readonly filtroControl = new FormControl('', { nonNullable: true });

  readonly displayedColumns: string[] = [
    '#',
    'nombre',
    'nombreDocumento',
    'usrCodigo',
    'fechaSubida',
    'accion',
  ];

  ngOnInit(): void {
    this.filtroControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(valor => valor.trim().length === 0 || valor.trim().length >= 3)
      )
      .subscribe(valor => {

        this.filtro.set(valor.trim());
        this.pageIndex.set(0);
        this.cargarDocumentos();

      });

    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.htmlDocumentoService.listarDocumentosPaginado(this.pageIndex(), this.pageSize(), this.filtro()).subscribe((data) => {
        
          this.documentos.set(data.content);
          this.totalElements.set(data.totalElements);
        
      });
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.cargarDocumentos();
  }

  irAGenerarHtml(): void {
    this.router.navigate(['/inicio/html/conversor-doc-html']);
  }

  getFechaCompleta(fecha: Date | string): string {
    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy") ?? '';
  }

  eliminar(documento: ArchivoDoc): void {
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
      if (!confirmado) {
        return;
      }

      this.htmlDocumentoService.eliminar(documento.id!).subscribe(() => {
        this.toastr.success('Documento eliminado correctamente', 'Exitoso');

        if (this.documentos().length === 1 && this.pageIndex() > 0) {
          this.pageIndex.update((v) => v - 1);
        }

        this.cargarDocumentos();
      });
    });
  }

  editar(documento: ArchivoDoc): void {
    this.router.navigate([`/inicio/html/resultado-doc-html/${documento.id}`]);
  }

}
