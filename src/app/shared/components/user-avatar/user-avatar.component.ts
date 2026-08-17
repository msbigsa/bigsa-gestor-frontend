import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

// Paleta alineada con los colores de marca ya usados en el template (primary, info, success, warning...).
const PALETA_COLORES = [
  '#5D87FF', '#49BEFF', '#13DEB9', '#FFAE1F', '#FA896B',
  '#539BFF', '#2A3547', '#7460EE', '#E46A76', '#31C446',
];

@Component({
  selector: 'app-user-avatar',
  imports: [],
  template: `
    @if (imagen && !errorCargaImagen) {
      <img
        [src]="imagen"
        [style.width.px]="size"
        [style.height.px]="size"
        class="rounded-full object-cover shrink-0"
        (error)="errorCargaImagen = true"
      />
    } @else {
      <div
        class="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.fontSize.px]="size / 2.5"
        [style.backgroundColor]="color"
      >{{ iniciales }}</div>
    }
  `,
})
export class UserAvatarComponent implements OnChanges {

  // Se espera un data URI completo (data:image/...;base64,...) o una URL absoluta -- el front no
  // adivina el mime type de un base64 crudo, eso lo arma quien lo mande.
  @Input() imagen?: string | null;
  @Input() nombre = '';
  @Input() size = 40;

  iniciales = '?';
  color = PALETA_COLORES[0];
  errorCargaImagen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nombre']) {
      this.iniciales = this.calcularIniciales(this.nombre);
      this.color = this.calcularColor(this.nombre);
    }

    if (changes['imagen']) {
      this.errorCargaImagen = false;
    }
  }

  private calcularIniciales(nombre: string): string {
    const palabras = (nombre ?? '').trim().split(/\s+/).filter(Boolean);

    if (palabras.length === 0) {
      return '?';
    }

    return palabras.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  // Mismo nombre -> mismo color siempre, sin necesidad de guardar nada.
  private calcularColor(nombre: string): string {
    let hash = 0;

    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }

    return PALETA_COLORES[Math.abs(hash) % PALETA_COLORES.length];
  }
}
