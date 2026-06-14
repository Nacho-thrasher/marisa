import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed top-4 right-4 z-[100] flex w-80 flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg animate-[slidein_.2s_ease]"
          [class]="styles[t.type]"
        >
          <span class="material-icons text-[20px]">{{ icons[t.type] }}</span>
          <p class="flex-1 text-sm font-medium leading-snug">{{ t.message }}</p>
          <button class="text-current/60 hover:text-current" (click)="toast.dismiss(t.id)">
            <span class="material-icons text-[18px]">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes slidein {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
})
export class ToastContainer {
  readonly toast = inject(ToastService);

  readonly styles: Record<string, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  };
  readonly icons: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };
}
