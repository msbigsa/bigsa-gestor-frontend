import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { EmisionMasivaLoteService } from 'src/app/services/emision-masiva/emisionMasivaLote.service';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { estadoLoteClase, estadoLoteLabel, usuarioTexto } from 'src/app/pages/emision-masiva/shared/estados-emision-masiva.util';
import {
  EliminarLoteDialogEmisionComponent,
  EliminarLoteDialogData,
} from 'src/app/pages/emision-masiva/shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { ForzarEstadoDialogEmisionComponent } from './forzar-estado-dialog/forzar-estado-dialog.component';

// Version administrativa de listar-lotes: mismas acciones de eliminar/forzar estado pero sin las
// restricciones de UI normales (enProceso, puedeEmitir, filtros en URL, polling). Los guardrails reales
// (estado intermedio, EMITIDO) siguen viviendo en el backend -- esta pantalla no los puede saltar.
@Component({
  selector: 'app-admin-lotes-emision',
  imports: [CommonModule, MaterialModule],
  templateUrl: './admin-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLotesEmisionComponent implements OnInit {

  private readonly loteService = inject(EmisionMasivaLoteService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  readonly lotes = signal<LoteEmisionResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteEmision | null>(null);

  readonly estadosDisponibles = Object.values(EstadoLoteEmision);

  readonly displayedColumns: string[] = ['#', 'archivo', 'fecha', 'usuario', 'estado', 'accion'];

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes(): void {
    this.loteService.listarLotes(
      this.pageIndex(),
      this.pageSize(),
      this.filtroEstado() ?? undefined,
      false,
      true, // incluye eliminados -- pantalla admin, se ven todos los estados sin excepcion
    ).subscribe(data => {
      this.lotes.set(data.content);
      this.totalElements.set(data.totalElements);
    });
  }

  onFiltroEstadoChange(estado: EstadoLoteEmision | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);
    this.cargarLotes();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarLotes();
  }

  forzarEstado(lote: LoteEmisionResponse): void {
    const dialogRef = this.dialog.open(ForzarEstadoDialogEmisionComponent, {
      width: '400px',
      disableClose: true,
      data: { lote },
    });

    dialogRef.afterClosed().subscribe((nuevoEstado?: EstadoLoteEmision) => {
      if (!nuevoEstado) {
        return;
      }

      this.loteService.forzarEstado(lote.loteId, nuevoEstado).subscribe(() => {
        this.toastr.success(`Estado del lote #${lote.loteId} actualizado a "${estadoLoteLabel(nuevoEstado)}"`, 'Exitoso');
        this.cargarLotes();
      });
    });
  }

  // Mismo flujo de eliminacion que listar-lotes, pero sin el guard de enProceso() en la UI -- los
  // guardrails reales (estado intermedio, EMITIDO) los sigue aplicando el backend igual.
  eliminar(lote: LoteEmisionResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
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
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLoteEmision.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  private abrirDialogoHijos(lote: LoteEmisionResponse, hijos: LoteEmisionResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogEmisionComponent, {
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
}
