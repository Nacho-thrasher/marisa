import { Component, input, signal } from '@angular/core';

/**
 * Panel de ayuda colapsable ("¿Cómo funciona?"). El contenido se proyecta.
 * Uso:
 *   <app-guia titulo="¿Cómo funciona el inventario?">
 *     <p>...</p>
 *   </app-guia>
 */
@Component({
  selector: 'app-guia',
  template: `
    <div class="mb-4 overflow-hidden rounded-xl border border-brand-100 bg-brand-50/40">
      <button
        class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        (click)="abierto.set(!abierto())"
      >
        <span class="material-icons text-[18px]">{{ icono() }}</span>
        {{ titulo() }}
        <span class="material-icons ml-auto text-[20px]">{{ abierto() ? 'expand_less' : 'expand_more' }}</span>
      </button>
      @if (abierto()) {
        <div class="space-y-2 border-t border-brand-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class Guia {
  readonly titulo = input('¿Cómo funciona?');
  readonly icono = input('help');
  readonly abierto = signal(false);
}
