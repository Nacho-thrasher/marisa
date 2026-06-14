import { Component, input, output } from '@angular/core';

/**
 * Modal presentacional. El padre controla la visibilidad y proyecta el contenido.
 * Uso:
 *   <app-modal [title]="'Título'" (closed)="cerrar()">
 *     contenido...
 *     <div modal-footer> ...botones... </div>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-[fade_.15s_ease]"
      (click)="onBackdrop($event)"
    >
      <div
        class="card w-full max-w-lg overflow-hidden animate-[pop_.18s_ease]"
        [class.max-w-2xl]="wide()"
        (click)="$event.stopPropagation()"
      >
        <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 class="text-lg font-bold text-slate-900">{{ title() }}</h3>
          <button class="btn-ghost btn-icon rounded-lg" (click)="closed.emit()">
            <span class="material-icons text-[20px]">close</span>
          </button>
        </header>
        <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
          <ng-content />
        </div>
        <footer class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <ng-content select="[modal-footer]" />
        </footer>
      </div>
    </div>
  `,
  styles: `
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `,
})
export class Modal {
  readonly title = input('');
  readonly wide = input(false);
  readonly closeOnBackdrop = input(true);
  readonly closed = output<void>();

  onBackdrop(_e: MouseEvent) {
    if (this.closeOnBackdrop()) this.closed.emit();
  }
}
