import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InsumoService } from '../../core/services/insumo.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';

@Component({
  selector: 'app-insumo-form-dialog',
  imports: [ReactiveFormsModule, Modal],
  template: `
    <app-modal title="Nuevo insumo" [wide]="true" (closed)="closed.emit()">
      <form [formGroup]="form" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Código</label>
          <input class="input" formControlName="codigo" placeholder="PAPA-002" />
        </div>
        <div>
          <label class="label">Nombre</label>
          <input class="input" formControlName="nombre" />
        </div>
        <div>
          <label class="label">Categoría</label>
          <input class="input" formControlName="categoria" />
        </div>
        <div>
          <label class="label">Unidad de medida</label>
          <select class="select" formControlName="unidad_medida">
            <option value="kg">kg</option>
            <option value="litros">litros</option>
            <option value="unidades">unidades</option>
          </select>
        </div>
        <div>
          <label class="label">Precio unitario</label>
          <input class="input" type="number" formControlName="precio_unitario" min="0" step="any" />
        </div>
        <div>
          <label class="label">Stock mínimo</label>
          <input class="input" type="number" formControlName="stock_minimo" min="0" step="any" />
        </div>
        <div>
          <label class="label">Stock crítico</label>
          <input class="input" type="number" formControlName="stock_critico" min="0" step="any" />
        </div>
      </form>

      <div modal-footer>
        <button class="btn btn-ghost" (click)="closed.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="guardar()">Crear</button>
      </div>
    </app-modal>
  `,
})
export class InsumoFormDialog {
  private fb = inject(FormBuilder);
  private service = inject(InsumoService);
  private toast = inject(ToastService);

  readonly saved = output<void>();
  readonly closed = output<void>();
  readonly saving = signal(false);

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    categoria: ['general', Validators.required],
    unidad_medida: ['kg', Validators.required],
    precio_unitario: [0, [Validators.required, Validators.min(0)]],
    stock_minimo: [0, Validators.min(0)],
    stock_critico: [0, Validators.min(0)],
  });

  guardar() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.service.crear(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Insumo creado');
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }
}
