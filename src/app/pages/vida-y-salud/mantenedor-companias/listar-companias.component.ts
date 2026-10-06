import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { VidaSaludCmasPdfService } from 'src/app/services/vida-y-salud/vidaSaludCmasPdf.service';
import { VidaSaludCompaniaService } from 'src/app/services/vida-y-salud/vidaSaludCompania.service';
import { CmasPdf } from 'src/app/models/vida-y-salud/CmasPdf';
import { CompaniaDisponible } from 'src/app/models/vida-y-salud/CompaniaDisponible';
import { EditarCompaniaDialogComponent, EditarCompaniaDialogData } from './editar-compania-dialog/editar-compania-dialog.component';

@Component({
  selector: 'app-listar-companias-vida-salud',
  imports: [CommonModule, MaterialModule],
  templateUrl: './listar-companias.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarCompaniasVidaSaludComponent implements OnInit {

  private readonly cmasPdfService = inject(VidaSaludCmasPdfService);
  private readonly companiaService = inject(VidaSaludCompaniaService);
  private readonly dialog = inject(MatDialog);

  readonly companias = toSignal(this.companiaService.listarDisponibles(), { initialValue: [] as CompaniaDisponible[] });
  readonly nombreCompaniaPorCodigo = computed(() =>
    new Map(this.companias().map(c => [c.ciasCodigo, c.ciasNombre]))
  );

  readonly configuraciones = signal<CmasPdf[]>([]);

  // Compañías del catálogo que todavía no tienen fila en CMAS_PDF -- las únicas candidatas a "Nueva".
  readonly companiasSinConfigurar = computed(() => {
    const configuradas = new Set(this.configuraciones().map(c => c.ciasCodigo));
    return this.companias().filter(c => !configuradas.has(c.ciasCodigo));
  });

  readonly displayedColumns: string[] = ['ciasCodigo', 'aNombreDe', 'tipoMatch', 'accion'];

  ngOnInit(): void {
    this.cargarConfiguraciones();
  }

  cargarConfiguraciones(): void {
    this.cmasPdfService.listar().subscribe(data => this.configuraciones.set(data));
  }

  nombreCompania(ciasCodigo: number): string {
    const nombre = this.nombreCompaniaPorCodigo().get(ciasCodigo);
    return nombre ? `${ciasCodigo} - ${nombre}` : `${ciasCodigo}`;
  }

  nuevaCompania(): void {
    const dialogRef = this.dialog.open(EditarCompaniaDialogComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { companiasDisponibles: this.companiasSinConfigurar() } satisfies EditarCompaniaDialogData,
    });

    dialogRef.afterClosed().subscribe((guardado?: CmasPdf) => {
      if (guardado) {
        this.cargarConfiguraciones();
      }
    });
  }

  editarCompania(configuracion: CmasPdf): void {
    const dialogRef = this.dialog.open(EditarCompaniaDialogComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        configuracion,
        nombreCompania: this.nombreCompaniaPorCodigo().get(configuracion.ciasCodigo),
      } satisfies EditarCompaniaDialogData,
    });

    dialogRef.afterClosed().subscribe((guardado?: CmasPdf) => {
      if (guardado) {
        this.cargarConfiguraciones();
      }
    });
  }
}
