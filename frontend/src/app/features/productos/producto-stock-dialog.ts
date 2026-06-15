import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../core/services/productos.service';
import { Producto } from '../../core/services/produccion.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';

@Component({
  selector: 'app-producto-stock-dialog',
  imports: [FormsModule, Modal],
  template: `
    <app-modal [title]="'Stock de ' + producto().nombre" (closed)="closed.emit()">
      <div class="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-800">
        <span class="material-icons text-[18px]">info</span>
        <span>
          Esto fija el stock de forma <b>manual</b>. Usalo para la <b>carga inicial</b> (lo que ya tenés hecho) o para
          <b>corregir</b> un conteo físico. En el día a día el stock sube solo al <b>completar una producción</b> y baja al <b>vender</b>.
        </span>
      </div>
      <p class="mb-4 text-sm text-slate-500">
        Stock actual: <b class="text-slate-800">{{ producto().stockActual ?? '0' }}</b> unidades
      </p>
      <div>
        <label class="label">Fijar stock en</label>
        <input class="input" type="number" min="0" step="any" [(ngModel)]="cantidad" />
      </div>
      <div class="mt-3">
        <label class="label">Motivo (opcional)</label>
        <input class="input" [(ngModel)]="motivo" placeholder="Conteo físico, corrección…" />
      </div>

      <div modal-footer>
        <button class="btn btn-ghost" (click)="closed.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="cantidad === null || cantidad < 0 || saving()" (click)="guardar()">
          Guardar
        </button>
      </div>
    </app-modal>
  `,
})
export class ProductoStockDialog implements OnInit {
  private service = inject(ProductosService);
  private toast = inject(ToastService);

  readonly producto = input.required<Producto>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  readonly saving = signal(false);

  cantidad: number | null = 0;
  motivo = '';

  ngOnInit() {
    this.cantidad = Number(this.producto().stockActual ?? 0);
  }

  guardar() {
    if (this.cantidad === null || this.cantidad < 0) return;
    this.saving.set(true);
    this.service.ajustarStock(this.producto().id, this.cantidad, this.motivo.trim() || undefined).subscribe({
      next: () => {
        this.toast.success('Stock actualizado');
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }
}
