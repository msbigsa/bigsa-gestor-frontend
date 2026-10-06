import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogResult } from 'src/app/shared/components/confirm-dialog/confirm-dialog-result.enum';
import { VidaSaludLoteService } from 'src/app/services/vida-y-salud/vidaSaludLote.service';
import { VidaSaludConfiguracionService } from 'src/app/services/vida-y-salud/vidaSaludConfiguracion.service';
import { LoteVidaSaludResponse } from 'src/app/models/vida-y-salud/LoteVidaSaludResponse';
import { EstadoLoteVidaSalud } from 'src/app/models/vida-y-salud/EstadoLoteVidaSalud';
import { estadoLoteClase, estadoLoteLabel, usuarioTexto, usuarioDescripcion, tieneFilasFacturadas, AVISO_ELIMINAR_FILAS_FACTURADAS } from 'src/app/pages/vida-y-salud/shared/estados-vida-salud.util';
import {
  EliminarLoteDialogVidaSaludComponent,
  EliminarLoteDialogData,
} from 'src/app/pages/vida-y-salud/shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { ForzarEstadoDialogVidaSaludComponent } from './forzar-estado-dialog/forzar-estado-dialog.component';

// Version administrativa de listar-lotes: mismas acciones de eliminar/forzar estado pero sin las
// restricciones de UI normales (puedeFacturar, filtros en URL, polling). Los guardrails reales (estado
// intermedio, etc.) siguen viviendo en el backend -- esta pantalla no los puede saltar, pero si guia
// al admin a resolverlos (forzar estado) en vez de solo dejarlo pegado en un error.
@Component({
  selector: 'app-admin-lotes-vida-salud',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './admin-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLotesVidaSaludComponent implements OnInit {

  // Coincide con EstadoLoteVidaSalud.INTERMEDIOS del backend -- unico caso que eliminarLote rechaza.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteVidaSalud[] =
    [EstadoLoteVidaSalud.VALIDANDO, EstadoLoteVidaSalud.PROCESANDO_DOCUMENTOS, EstadoLoteVidaSalud.FACTURANDO];

  private readonly loteService = inject(VidaSaludLoteService);
  private readonly configuracionService = inject(VidaSaludConfiguracionService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  readonly lotes = signal<LoteVidaSaludResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteVidaSalud | null>(null);

  readonly estadosDisponibles = Object.values(EstadoLoteVidaSalud);

  readonly displayedColumns: string[] = ['#', 'archivo', 'fecha', 'usuario', 'estado', 'accion'];

  // GLO_PARAMETRO DIR_VIDASALUD -- carpeta compartida de documentos.
  readonly dirVidaSalud = signal('');
  readonly guardandoConfig = signal(false);

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.configuracionService.obtenerConfiguracion().subscribe(config => this.dirVidaSalud.set(config.dirVidaSalud ?? ''));
  }

  guardarConfiguracion(): void {
    const valor = this.dirVidaSalud().trim();
    if (!valor) {
      this.toastr.error('Debe indicar una ruta', 'Error');
      return;
    }

    this.guardandoConfig.set(true);
    this.configuracionService.actualizarConfiguracion({ dirVidaSalud: valor }).subscribe({
      next: config => {
        this.dirVidaSalud.set(config.dirVidaSalud);
        this.guardandoConfig.set(false);
        this.toastr.success('Configuración actualizada correctamente', 'Exitoso');
      },
      error: () => this.guardandoConfig.set(false),
    });
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

  onFiltroEstadoChange(estado: EstadoLoteVidaSalud | null): void {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);
    this.cargarLotes();
  }

  showMore(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarLotes();
  }

  forzarEstado(lote: LoteVidaSaludResponse): void {
    this.abrirDialogoForzarEstado(lote, nuevoEstado => {
      this.toastr.success(`Estado del lote #${lote.loteId} actualizado a "${estadoLoteLabel(nuevoEstado)}"`, 'Exitoso');
      this.cargarLotes();
    });
  }

  // Mismo flujo de eliminacion que listar-lotes, pero sin el guard de enProceso() en la UI -- el
  // guardrail real (estado intermedio) lo sigue aplicando el backend igual, asi que si el lote esta en
  // proceso no se intenta eliminar directo (fallaria) -- se guia primero a forzar el estado.
  eliminar(lote: LoteVidaSaludResponse): void {
    if (AdminLotesVidaSaludComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote)) {
      this.avisarEstadoEnProceso(lote);
      return;
    }

    this.confirmarYEliminar(lote);
  }

  private avisarEstadoEnProceso(lote: LoteVidaSaludResponse): void {
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

  // Comun a forzarEstado() y al flujo de eliminar-en-proceso: abre el picker y hace el PUT si se elige
  // algo -- el resto (toast, refresco, continuar a eliminar o no) queda a cargo del caller.
  private abrirDialogoForzarEstado(lote: LoteVidaSaludResponse, onExito: (nuevoEstado: EstadoLoteVidaSalud) => void): void {
    const dialogRef = this.dialog.open(ForzarEstadoDialogVidaSaludComponent, {
      width: '400px',
      disableClose: true,
      data: { lote },
    });

    dialogRef.afterClosed().subscribe((nuevoEstado?: EstadoLoteVidaSalud) => {
      if (!nuevoEstado) {
        return;
      }

      this.loteService.forzarEstado(lote.loteId, nuevoEstado).subscribe(() => onExito(nuevoEstado));
    });
  }

  private confirmarYEliminar(lote: LoteVidaSaludResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Eliminar lote (sin restricciones de UI)',
        message: `¿Está seguro que desea eliminar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esta acción no se puede deshacer.`
          + (tieneFilasFacturadas(lote) ? `\n${AVISO_ELIMINAR_FILAS_FACTURADAS}` : ''),
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
        const eliminables = hijos.filter(h => h.estadoLote !== EstadoLoteVidaSalud.ELIMINADO);

        if (eliminables.length > 0) {
          this.abrirDialogoHijos(lote, eliminables);
        } else {
          this.confirmarEliminacion(lote.loteId, []);
        }
      });
    });
  }

  private abrirDialogoHijos(lote: LoteVidaSaludResponse, hijos: LoteVidaSaludResponse[]): void {
    const dialogRef = this.dialog.open(EliminarLoteDialogVidaSaludComponent, {
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
