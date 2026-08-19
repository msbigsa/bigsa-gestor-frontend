import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { AvisoCobranzaLoteService } from 'src/app/services/aviso-cobranza/avisoCobranzaLote.service';
import { AvisoCobranzaCompaniaService } from 'src/app/services/aviso-cobranza/avisoCobranzaCompania.service';
import { LoteCargaResponse } from 'src/app/models/aviso-cobranza/LoteCargaResponse';
import { CompaniaDisponible } from 'src/app/models/aviso-cobranza/CompaniaDisponible';
import { EstadoLote } from 'src/app/models/aviso-cobranza/EstadoLote';
import { estadoLoteClase, estadoLoteLabel, usuarioTexto } from 'src/app/pages/aviso-cobranza/shared/estados-aviso-cobranza.util';
import {
  EliminarLoteDialogComponent,
  EliminarLoteDialogData,
} from 'src/app/pages/aviso-cobranza/shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { ForzarEstadoDialogComponent } from './forzar-estado-dialog/forzar-estado-dialog.component';

// Version administrativa de listar-lotes: mismas acciones de eliminar/forzar estado
// pero sin las restricciones normales (enProceso, puedeValidar/puedeEnviar, filtros en URL, polling).
@Component({
  selector: 'app-admin-lotes',
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  templateUrl: './admin-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLotesComponent implements OnInit {

  private readonly loteService = inject(AvisoCobranzaLoteService);
  private readonly companiaService = inject(AvisoCobranzaCompaniaService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  readonly lotes = signal<LoteCargaResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLote | null>(null);

  readonly companias = toSignal(this.companiaService.listarDisponibles(), { initialValue: [] as CompaniaDisponible[] });
  readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.ciasCodigo, c.ciasNombre]))
  );

  readonly estadosDisponibles = Object.values(EstadoLote);

  readonly displayedColumns: string[] = ['#', 'archivo', 'compania', 'fecha', 'usuario', 'estado', 'accion'];

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

  onFiltroEstadoChange(estado: EstadoLote | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);
    this.cargarLotes();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarLotes();
  }

  nombreCompania(ciasCodigo: number | undefined): string {
    if (ciasCodigo == null) {
      return '-';
    }

    const nombre = this.nombreCompaniaPorCodigo().get(ciasCodigo);
    return nombre ? `${ciasCodigo} - ${nombre}` : `${ciasCodigo}`;
  }

  forzarEstado(lote: LoteCargaResponse): void {
    const dialogRef = this.dialog.open(ForzarEstadoDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { lote },
    });

    dialogRef.afterClosed().subscribe((nuevoEstado?: EstadoLote) => {
      if (!nuevoEstado) {
        return;
      }

      this.loteService.forzarEstado(lote.loteId, nuevoEstado).subscribe(() => {
        this.toastr.success(`Estado del lote #${lote.loteId} actualizado a "${estadoLoteLabel(nuevoEstado)}"`, 'Exitoso');
        this.cargarLotes();
      });
    });
  }

  // Mismo flujo de eliminacion que listar-lotes, pero sin el guard de enProceso() -- se puede en cualquier estado.
  eliminar(lote: LoteCargaResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Eliminar lote (sin restricciones)',
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

      // Un hijo no puede tener hijos propios (sin correcciones anidadas).
      const hijos$ = lote.loteOrigenId ? of([]) : this.loteService.listarCorrecciones(lote.loteId);

      hijos$.subscribe(hijos => {
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLote.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  private abrirDialogoHijos(lote: LoteCargaResponse, hijos: LoteCargaResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogComponent, {
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
