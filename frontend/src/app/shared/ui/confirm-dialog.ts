import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmService, ConfirmTone } from './confirm.service';

/**
 * Diálogo global de confirmación / prompt. Reemplaza window.confirm y window.prompt.
 * Se monta una sola vez (en App) y reacciona al ConfirmService.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [FormsModule],
  template: `
    @if (s(); as st) {
      <div
        class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-[fade_.15s_ease]"
        (click)="cancel()"
      >
        <div
          class="card w-full max-w-md overflow-hidden animate-[pop_.18s_ease]"
          (click)="$event.stopPropagation()"
        >
          <div class="px-6 pt-6">
            <div class="flex items-start gap-4">
              <div class="icon-chip h-11 w-11" [class]="chip()">
                <span class="material-icons text-[22px]">{{ st.icon || defaultIcon() }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-bold text-slate-900">{{ st.title }}</h3>
                @if (st.message) {
                  <p class="mt-1 text-sm leading-relaxed text-slate-500">{{ st.message }}</p>
                }
              </div>
            </div>

            @if (st.kind === 'prompt') {
              <div class="mt-4">
                @if (st.label) {
                  <label class="label">{{ st.label }}</label>
                }
                @if (st.multiline) {
                  <textarea
                    #field
                    class="textarea"
                    rows="3"
                    [placeholder]="st.placeholder || ''"
                    [ngModel]="value()"
                    (ngModelChange)="value.set($event)"
                  ></textarea>
                } @else {
                  <input
                    #field
                    class="input"
                    [placeholder]="st.placeholder || ''"
                    [ngModel]="value()"
                    (ngModelChange)="value.set($event)"
                    (keydown.enter)="confirm()"
                  />
                }
              </div>
            }
          </div>

          <div class="mt-5 flex justify-end gap-2 border-t border-[var(--color-line)] bg-slate-50/60 px-6 py-4">
            <button class="btn btn-outline" (click)="cancel()">{{ st.cancelText }}</button>
            <button class="btn" [class]="confirmClass()" [disabled]="!canConfirm()" (click)="confirm()">
              {{ st.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `,
})
export class ConfirmDialog {
  private svc = inject(ConfirmService);
  readonly s = this.svc.state;
  readonly value = signal('');

  constructor() {
    // Sincroniza el valor inicial del prompt cada vez que se abre un diálogo.
    effect(() => {
      const st = this.s();
      if (st?.kind === 'prompt') {
        this.value.set(st.initialValue ?? '');
        queueMicrotask(() => {
          const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            'app-confirm-dialog .input, app-confirm-dialog .textarea',
          );
          el?.focus();
        });
      }
    });
  }

  readonly canConfirm = computed(() => {
    const st = this.s();
    if (!st) return false;
    if (st.kind === 'prompt' && st.required) return this.value().trim().length > 0;
    return true;
  });

  private readonly tone = computed<ConfirmTone>(() => this.s()?.tone ?? 'primary');

  chip() {
    return { danger: 'chip-rose', warning: 'chip-amber', primary: 'chip-brand' }[this.tone()];
  }
  confirmClass() {
    return { danger: 'btn-danger', warning: 'btn-primary', primary: 'btn-primary' }[this.tone()];
  }
  defaultIcon() {
    return { danger: 'warning', warning: 'help', primary: 'help' }[this.tone()];
  }

  confirm() {
    const st = this.s();
    if (!st) return;
    if (!this.canConfirm()) return;
    this.svc.settle(st.kind === 'prompt' ? this.value().trim() : true);
  }

  cancel() {
    const st = this.s();
    if (!st) return;
    this.svc.settle(st.kind === 'prompt' ? null : false);
  }
}
