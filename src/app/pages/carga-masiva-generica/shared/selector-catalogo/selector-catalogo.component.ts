import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, input, signal, untracked } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { MaterialModule } from 'src/app/material.module';

export interface OpcionCatalogo {
  codigo: number | string;
  descripcion: string;
}

// Autocomplete "codigo - descripcion" sobre un catalogo; el valor del control es el codigo elegido.
@Component({
  selector: 'app-selector-catalogo',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './selector-catalogo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorCatalogoComponent), multi: true },
  ],
})
export class SelectorCatalogoComponent implements ControlValueAccessor {

  readonly opciones = input<OpcionCatalogo[]>([]);
  readonly placeholder = input('Busque...');

  readonly texto = new FormControl<string | OpcionCatalogo>('', { nonNullable: true });
  // Se actualiza a mano: los cambios programaticos del texto no emiten valueChanges.
  private readonly textoActual = signal<string | OpcionCatalogo>('');

  private readonly valor = signal<number | string | null>(null);

  readonly seleccionada = computed(() => this.opciones().find(o => o.codigo === this.valor()) ?? null);

  readonly filtradas = computed(() => {
    const actual = this.textoActual();
    const consulta = (typeof actual === 'string' ? actual : this.etiqueta(actual)).toLowerCase();

    return this.opciones().filter(o => this.etiqueta(o).toLowerCase().includes(consulta));
  });

  private onChange: (valor: number | string | null) => void = () => { };
  onTouched: () => void = () => { };

  constructor() {
    // Muestra el texto del valor actual cuando llega el catalogo o cambia el valor desde afuera.
    effect(() => {
      const seleccionada = this.seleccionada();

      untracked(() => this.fijarTexto(seleccionada ?? ''));
    });

    // Tipear sobre una seleccion la descarta: el valor solo cambia eligiendo una opcion.
    this.texto.valueChanges.subscribe(actual => {
      this.textoActual.set(actual);

      if (typeof actual === 'string' && this.valor() !== null) {
        this.valor.set(null);
        this.onChange(null);
      }
    });
  }

  etiqueta = (opcion: OpcionCatalogo): string => `${opcion.codigo} - ${opcion.descripcion}`;

  display = (opcion: OpcionCatalogo | string | null): string =>
    !opcion ? '' : (typeof opcion === 'string' ? opcion : this.etiqueta(opcion));

  onSeleccion(event: MatAutocompleteSelectedEvent): void {
    const opcion = event.option.value as OpcionCatalogo;

    this.valor.set(opcion.codigo);
    this.onChange(opcion.codigo);
  }

  // Sin propagar: el form-field abriria el panel con la seleccion anterior.
  limpiar(event: MouseEvent, trigger: MatAutocompleteTrigger, auto: MatAutocomplete): void {
    event.stopPropagation();
    trigger.closePanel();
    auto.options.forEach(opcion => opcion.deselect(false));

    this.fijarTexto('');
    this.valor.set(null);
    this.onChange(null);
  }

  private fijarTexto(texto: string | OpcionCatalogo): void {
    this.texto.setValue(texto, { emitEvent: false });
    this.textoActual.set(texto);
  }

  // Selecciona todo el texto al enfocar, para poder tipear directo sin borrar a mano.
  seleccionarTexto(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  writeValue(valor: number | string | null): void {
    this.valor.set(valor ?? null);
  }

  registerOnChange(fn: (valor: number | string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    deshabilitado ? this.texto.disable({ emitEvent: false }) : this.texto.enable({ emitEvent: false });
  }
}
