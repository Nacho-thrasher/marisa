import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InsumoService } from '../../core/services/insumo.service';
import { ToastService } from '../../shared/ui/toast.service';
import { InsumoListItem } from '../../core/models/insumo.model';
import { Modal } from '../../shared/ui/modal';

@Component({
  selector: 'app-movimiento-dialog',
  imports: [ReactiveFormsModule, Modal],
  template: `
    <app-modal
      [title]="(tipo() === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso') + ' — ' + insumo().nombre"
      (closed)="closed.emit()"
    >
      <div class="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Stock actual:
        <b class="text-slate-900">{{ insumo().stock_actual }} {{ insumo().unidad_medida }}</b>
      </div>

      <form [formGroup]="form" class="space-y-4">
        <div>
          <label class="label">Cantidad ({{ insumo().unidad_medida }})</label>
          <input class="input" type="number" formControlName="cantidad" min="0" step="any" />
        </div>

        @if (tipo() === 'ingreso') {
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="label">Precio unitario</label>
              <input class="input" type="number" formControlName="precio_unitario" min="0" step="any" />
            </div>
            <div>
              <label class="label">N° de lote</label>
              <input class="input" formControlName="numero_lote" />
            </div>
          </div>
          <div>
            <label class="label">Proveedor</label>
            <input class="input" formControlName="proveedor" />
          </div>
        } @else {
          <div>
            <label class="label">Motivo</label>
            <select class="select" formControlName="motivo">
              <option value="PRODUCCION">Producción</option>
              <option value="PERDIDA">Pérdida</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>
        }

        <div>
          <label class="label">Observaciones</label>
          <textarea class="textarea" rows="2" formControlName="observaciones"></textarea>
        </div>
      </form>

      <div modal-footer>
        <button class="btn btn-ghost" (click)="closed.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="guardar()">
          Confirmar
        </button>
      </div>
    </app-modal>
  `,
})
export class MovimientoDialog {
  private fb = inject(FormBuilder);
  private service = inject(InsumoService);
  private toast = inject(ToastService);

  readonly insumo = input.required<InsumoListItem>();
  readonly tipo = input.required<'ingreso' | 'egreso'>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  readonly saving = signal(false);

  form = this.fb.nonNullable.group({
    cantidad: [null as number | null, [Validators.required, Validators.min(0.001)]],
    precio_unitario: [null as number | null],
    proveedor: [''],
    numero_lote: [''],
    motivo: ['PRODUCCION'],
    observaciones: [''],
  });

  guardar() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.insumo().id;

    const obs$ =
      this.tipo() === 'ingreso'
        ? this.service.ingreso(id, {
            cantidad: v.cantidad!,
            precio_unitario: v.precio_unitario ?? undefined,
            proveedor: v.proveedor || undefined,
            numero_lote: v.numero_lote || undefined,
            observaciones: v.observaciones || undefined,
          })
        : this.service.egreso(id, {
            cantidad: v.cantidad!,
            motivo: v.motivo,
            observaciones: v.observaciones || undefined,
          });

    obs$.subscribe({
      next: () => {
        this.toast.success(this.tipo() === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado');
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }
}
