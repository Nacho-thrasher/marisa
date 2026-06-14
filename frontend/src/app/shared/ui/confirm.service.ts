import { Injectable, signal } from '@angular/core';

export type ConfirmTone = 'danger' | 'primary' | 'warning';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: string;
}

export interface PromptOptions extends ConfirmOptions {
  label?: string;
  placeholder?: string;
  initialValue?: string;
  required?: boolean;
  multiline?: boolean;
}

interface ConfirmState extends PromptOptions {
  kind: 'confirm' | 'prompt';
  resolve: (value: boolean | string | null) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  /** Diálogo activo (null = ninguno). El componente <app-confirm-dialog> lo observa. */
  readonly state = signal<ConfirmState | null>(null);

  /** Confirmación booleana. Resuelve true (aceptar) / false (cancelar). */
  confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        kind: 'confirm',
        tone: 'primary',
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        ...opts,
        resolve: (v) => resolve(v === true),
      });
    });
  }

  /** Pide texto al usuario. Resuelve el string, o null si se cancela. */
  prompt(opts: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.state.set({
        kind: 'prompt',
        tone: 'primary',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        required: true,
        ...opts,
        resolve: (v) => resolve(typeof v === 'string' ? v : null),
      });
    });
  }

  /** Llamado por el componente al resolver. */
  settle(value: boolean | string | null) {
    const s = this.state();
    if (!s) return;
    this.state.set(null);
    s.resolve(value);
  }
}
