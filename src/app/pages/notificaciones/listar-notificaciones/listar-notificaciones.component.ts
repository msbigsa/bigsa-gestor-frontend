import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from 'src/app/material.module';
import { NotificacionService } from 'src/app/services/notifica/notificacion.service';
import { Notificacion } from 'src/app/models/notifica/Notificacion';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';

@Component({
  selector: 'app-listar-notificaciones',
  imports: [CommonModule, MaterialModule, MatPaginatorModule, TablerIconsModule],
  providers: [DatePipe],
  templateUrl: './listar-notificaciones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarNotificacionesComponent implements OnInit {

  private readonly notificacionService = inject(NotificacionService);
  private readonly datePipe = inject(DatePipe);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly totalElements = signal(0);

  readonly displayedColumns: string[] = ['estado', 'titulo', 'mensaje', 'fecha', 'acciones'];

  ngOnInit(): void {
    if (!this.notificacionService.habilitado) {
      this.router.navigate(['/inicio']);
      return;
    }

    this.cargar();
  }

  cargar(): void {
    this.notificacionService.listarTodas(this.pageIndex(), this.pageSize()).subscribe(data => {
      this.notificaciones.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargar();
  }

  marcarLeida(notificacion: Notificacion): void {
    if (notificacion.leida) {
      return;
    }

    this.notificacionService.marcarLeida(notificacion.id);

    this.notificaciones.update(actuales =>
      actuales.map(n => n.id === notificacion.id ? { ...n, leida: true } : n)
    );
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas();

    this.notificaciones.update(actuales => actuales.map(n => ({ ...n, leida: true })));
  }

  eliminar(notificacion: Notificacion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar notificación',
        message: `¿Está seguro que desea eliminar la notificación "${notificacion.titulo}"? Dejará de mostrarse en tu bandeja.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.notificacionService.eliminar(notificacion.id);

      this.notificaciones.update(actuales => actuales.filter(n => n.id !== notificacion.id));
      this.totalElements.update(total => total - 1);

      if (this.notificaciones().length === 0 && this.pageIndex() > 0) {
        this.pageIndex.update(v => v - 1);
        this.cargar();
      }
    });
  }

  getFechaCompleta(fecha: string): string {
    return this.datePipe.transform(fecha, "EEEE, d 'de' MMMM 'de' yyyy, HH:mm") ?? '';
  }

  readonly hayNoLeidas = () => this.notificaciones().some(n => !n.leida);
}
