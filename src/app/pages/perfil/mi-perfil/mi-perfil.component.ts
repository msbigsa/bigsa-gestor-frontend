import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, LowerCasePipe, TitleCasePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from 'src/app/material.module';
import { LoginService } from 'src/app/services/login.service';
import { UserAvatarComponent } from 'src/app/shared/components/user-avatar/user-avatar.component';

const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule, MaterialModule, TitleCasePipe, LowerCasePipe, UserAvatarComponent, TablerIconsModule],
  templateUrl: './mi-perfil.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiPerfilComponent {

  private readonly loginService = inject(LoginService);
  private readonly toastr = inject(ToastrService);

  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;

  readonly usuario = this.loginService.profile;
  readonly subiendo = signal(false);

  seleccionarArchivo(): void {
    this.inputArchivo.nativeElement.click();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo despues, aunque falle la validacion

    if (!archivo) {
      return;
    }

    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      this.toastr.error('La imagen no puede superar los 2 MB', 'Error');
      return;
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.toastr.error('Formato no soportado -- use JPG, PNG o WEBP', 'Error');
      return;
    }

    this.subiendo.set(true);

    this.loginService.actualizarFotoPerfil(archivo).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.toastr.success('Foto de perfil actualizada', 'Exitoso');
      },
      error: () => this.subiendo.set(false),
    });
  }

  eliminarFoto(): void {
    this.loginService.eliminarFotoPerfil().subscribe(() => {
      this.toastr.success('Foto de perfil eliminada', 'Exitoso');
    });
  }
}
