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
import { EmisionMasivaLoteService } from 'src/app/services/emision-masiva/emisionMasivaLote.service';
import { EmisionMasivaConfiguracionService } from 'src/app/services/emision-masiva/emisionMasivaConfiguracion.service';
import { LoteEmisionResponse } from 'src/app/models/emision-masiva/LoteEmisionResponse';
import { EstadoLoteEmision } from 'src/app/models/emision-masiva/EstadoLoteEmision';
import { estadoLoteClase, estadoLoteLabel, usuarioTexto, usuarioDescripcion, tieneFilasEmitidas, AVISO_ELIMINAR_FILAS_EMITIDAS } from 'src/app/pages/emision-masiva/shared/estados-emision-masiva.util';
import {
  EliminarLoteDialogEmisionComponent,
  EliminarLoteDialogData,
} from 'src/app/pages/emision-masiva/shared/eliminar-lote-dialog/eliminar-lote-dialog.component';
import { ForzarEstadoDialogEmisionComponent } from './forzar-estado-dialog/forzar-estado-dialog.component';

// Version administrativa de listar-lotes: mismas acciones de eliminar/forzar estado pero sin las
// restricciones de UI normales (puedeEmitir, filtros en URL, polling). Los guardrails reales (estado
// intermedio, EMITIDO) siguen viviendo en el backend -- esta pantalla no los puede saltar, pero si guia
// al admin a resolverlos (forzar estado) en vez de solo dejarlo pegado en un error.
@Component({
  selector: 'app-admin-lotes-emision',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './admin-lotes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLotesEmisionComponent implements OnInit {

  // Coincide con EstadoLoteEmision.INTERMEDIOS del backend -- unico caso que eliminarLote rechaza.
  private static readonly ESTADOS_EN_PROCESO: EstadoLoteEmision[] =
    [EstadoLoteEmision.VALIDANDO, EstadoLoteEmision.PROCESANDO_DOCUMENTOS, EstadoLoteEmision.EMITIENDO];

  private readonly loteService = inject(EmisionMasivaLoteService);
  private readonly configuracionService = inject(EmisionMasivaConfiguracionService);
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);

  readonly lotes = signal<LoteEmisionResponse[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly filtroEstado = signal<EstadoLoteEmision | null>(null);

  readonly estadosDisponibles = Object.values(EstadoLoteEmision);

  readonly displayedColumns: string[] = ['#', 'archivo', 'fecha', 'usuario', 'estado', 'accion'];

  // GLO_PARAMETRO DIR_EMI_MAS -- carpeta compartida de documentos.
  readonly dirEmiMas = signal('');
  readonly guardandoConfig = signal(false);

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.configuracionService.obtenerConfiguracion().subscribe(config => this.dirEmiMas.set(config.dirEmiMas ?? ''));
  }

  guardarConfiguracion(): void {
    const valor = this.dirEmiMas().trim();
    if (!valor) {
      this.toastr.error('Debe indicar una ruta', 'Error');
      return;
    }

    this.guardandoConfig.set(true);
    this.configuracionService.actualizarConfiguracion({ dirEmiMas: valor }).subscribe({
      next: config => {
        this.dirEmiMas.set(config.dirEmiMas);
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
    this.abrirDialogoForzarEstado(lote, nuevoEstado => {
      this.toastr.success(`Estado del lote #${lote.loteId} actualizado a "${estadoLoteLabel(nuevoEstado)}"`, 'Exitoso');
      this.cargarLotes();
    });
  }

  // Mismo flujo de eliminacion que listar-lotes, pero sin el guard de enProceso() en la UI -- el
  // guardrail real (estado intermedio) lo sigue aplicando el backend igual, asi que si el lote esta en
  // proceso no se intenta eliminar directo (fallaria) -- se guia primero a forzar el estado, para que
  // "quiero eliminarlo" siga siendo un solo flujo desde admin, sin que el usuario tenga que descubrir por
  // su cuenta que hay un paso previo.
  eliminar(lote: LoteEmisionResponse): void {
    if (AdminLotesEmisionComponent.ESTADOS_EN_PROCESO.includes(lote.estadoLote)) {
      this.avisarEstadoEnProceso(lote);
      return;
    }

    this.confirmarYEliminar(lote);
  }

  private avisarEstadoEnProceso(lote: LoteEmisionResponse): void {
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
  private abrirDialogoForzarEstado(lote: LoteEmisionResponse, onExito: (nuevoEstado: EstadoLoteEmision) => void): void {
    const dialogRef = this.dialog.open(ForzarEstadoDialogEmisionComponent, {
      width: '400px',
      disableClose: true,
      data: { lote },
    });

    dialogRef.afterClosed().subscribe((nuevoEstado?: EstadoLoteEmision) => {
      if (!nuevoEstado) {
        return;
      }

      this.loteService.forzarEstado(lote.loteId, nuevoEstado).subscribe(() => onExito(nuevoEstado));
    });
  }

  private confirmarYEliminar(lote: LoteEmisionResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        title: 'Eliminar lote (sin restricciones de UI)',
        message: `¿Está seguro que desea eliminar el lote #${lote.loteId} ("${lote.nombreArchivoOrigen}")? Esta acción no se puede deshacer.`
          + (tieneFilasEmitidas(lote) ? `\n${AVISO_ELIMINAR_FILAS_EMITIDAS}` : ''),
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
  readonly usuarioDescripcion = usuarioDescripcion;
}
