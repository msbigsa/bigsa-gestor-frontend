import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { CargaMasivaGenericaLoteService } from 'src/app/services/carga-masiva-generica/cargaMasivaGenericaLote.service';
import { LoteCargaResponse } from 'src/app/models/carga-masiva-generica/LoteCargaResponse';
import { EstadoLoteCarga } from 'src/app/models/carga-masiva-generica/EstadoLoteCarga';
import { ESTADOS_EN_PROCESO, estadoLoteClase, estadoLoteLabel, usuarioTexto, usuarioDescripcion } from 'src/app/pages/carga-masiva-generica/shared/estados-carga-masiva.util';
import {
  EliminarLoteDialogCargaMasivaComponent,
  EliminarLoteDialogData,
} from 'src/app/pages/carga-masiva-generica/shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { ForzarEstadoDialogCargaMasivaComponent } from './forzar-estado-dialog/forzar-estado-dialog.component';

// Version admin de listar-lotes: eliminar/forzar estado sin las restricciones de UI; el backend mantiene las suyas.
@Component({
  selector: 'app-admin-lotes-carga-masiva',
  imports: [CommonModule, MaterialModule],
  templateUrl: './admin-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLotesCargaMasivaComponent implements OnInit {

  private readonly loteService = inject(CargaMasivaGenericaLoteService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  readonly lotes = signal<LoteCargaResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteCarga | null>(null);

  readonly estadosDisponibles = Object.values(EstadoLoteCarga);

  readonly displayedColumns: string[] = ['#', 'archivo', 'fecha', 'usuario', 'estado', 'accion'];

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes(): void {
    this.loteService.listarLotes(
      this.pageIndex(),
      this.pageSize(),
      this.filtroEstado() ?? undefined,
      undefined,
      false,
      true, // incluye eliminados -- pantalla admin, se ven todos los estados sin excepcion
    ).subscribe(data => {
      this.lotes.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  onFiltroEstadoChange(estado: EstadoLoteCarga | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);
    this.cargarLotes();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarLotes();
  }

  forzarEstado(lote: LoteCargaResponse): void {
    this.abrirDialogoForzarEstado(lote, nuevoEstado => {
      this.toastr.success(`Estado del lote #${lote.loteId} actualizado a "${estadoLoteLabel(nuevoEstado)}"`, 'Exitoso');
      this.cargarLotes();
    });
  }

  // Un lote en proceso no se puede eliminar: se guia primero a forzar su estado.
  eliminar(lote: LoteCargaResponse): void {
    if (ESTADOS_EN_PROCESO.includes(lote.estadoLote)) {
      this.avisarEstadoEnProceso(lote);
      return;
    }

    this.confirmarYEliminar(lote);
  }

  private avisarEstadoEnProceso(lote: LoteCargaResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      disableClose: true,
      data: {
        title: 'Lote en proceso',
        message: `El lote #${lote.loteId} está en estado "${estadoLoteLabel(lote.estadoLote)}" (en proceso) y no se puede eliminar mientras tanto.`
          + '\nPara eliminarlo, primero hay que forzar su estado a uno que no esté en proceso.',
        confirmText: 'Forzar estado',
        cancelText: 'Cancelar',
        type: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      this.abrirDialogoForzarEstado(lote, nuevoEstado => {
        this.toastr.success(`Estado del lote #${lote.loteId} actualizado a "${estadoLoteLabel(nuevoEstado)}"`, 'Exitoso');
        this.cargarLotes();
        this.confirmarYEliminar({ ...lote, estadoLote: nuevoEstado });
      });
    });
  }

  // Abre el picker y hace el PUT; lo que sigue queda a cargo del caller.
  private abrirDialogoForzarEstado(lote: LoteCargaResponse, onExito: (nuevoEstado: EstadoLoteCarga) => void): void {
    const dialogRef = this.dialog.open(ForzarEstadoDialogCargaMasivaComponent, {
      width: '400px',
      disableClose: true,
      data: { lote },
    });

    dialogRef.afterClosed().subscribe((nuevoEstado?: EstadoLoteCarga) => {
      if (!nuevoEstado) {
        return;
      }

      this.loteService.forzarEstado(lote.loteId, nuevoEstado).subscribe(() => onExito(nuevoEstado));
    });
  }

  private confirmarYEliminar(lote: LoteCargaResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Eliminar lote (sin restricciones de UI)',
        message: `¿Está seguro que desea eliminar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado !== ConfirmDialogResult.CONFIRM) {
        return;
      }

      const hijos$ = lote.loteOrigenId ? of([]) : this.loteService.listarCorrecciones(lote.loteId);

      hijos$.subscribe(hijos => {
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLoteCarga.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  private abrirDialogoHijos(lote: LoteCargaResponse, hijos: LoteCargaResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogCargaMasivaComponent, {
      width: '480px',
      disableClose: true,
      data: { lote, hijos } satisfies EliminarLoteDialogData,
    });

    dialogRef.afterClosed().subscribe((hijosAEliminar?: number[]) => {
      if (hijosAEliminar) {
        this.confirmarEliminacion(lote.loteId, hijosAEliminar);
      }
    });
  }

  private confirmarEliminacion(loteId: number, hijosAEliminar: number[]): void {
    this.loteService.eliminarLote(loteId, hijosAEliminar).subscribe(() => {
      this.toastr.success('Lote eliminado correctamente', 'Exitoso');

      if (this.lotes().length === 1 && this.pageIndex() > 0) {
        this.pageIndex.update(v => v - 1);
      }

      this.cargarLotes();
    });
  }

  readonly estadoLabel = estadoLoteLabel;
  readonly estadoClase = estadoLoteClase;
  readonly usuarioTexto = usuarioTexto;
  readonly usuarioDescripcion = usuarioDescripcion;
}
