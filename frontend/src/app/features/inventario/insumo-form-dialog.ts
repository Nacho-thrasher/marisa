import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InsumoService } from '../../core/services/insumo.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';
import { InsumoListItem } from '../../core/models/insumo.model';

const NUEVA_CATEGORIA = '__nueva__';

@Component({
  selector: 'app-insumo-form-dialog',
  imports: [ReactiveFormsModule, Modal],
  template: `
    <app-modal [title]="insumo() ? 'Editar insumo' : 'Nuevo insumo'" [wide]="true" (closed)="closed.emit()">
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
          <select class="select" formControlName="categoria">
            @for (c of categorias(); track c) {
              <option [value]="c">{{ c }}</option>
            }
            <option [value]="NUEVA_CATEGORIA">+ Nueva categoría…</option>
          </select>
          @if (form.value.categoria === NUEVA_CATEGORIA) {
            <input class="input mt-2" formControlName="categoriaNueva" placeholder="Nombre de la nueva categoría" />
          }
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
        @if (insumo() && precioCambio()) {
          <div class="sm:col-span-2">
            <label class="label">Motivo del cambio de precio (opcional)</label>
            <input class="input" formControlName="razon_cambio_precio" placeholder="Ej.: aumento de proveedor" />
          </div>
        }
      </form>

      <div modal-footer>
        <button class="btn btn-ghost" (click)="closed.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="guardar()">
          {{ insumo() ? 'Guardar cambios' : 'Crear' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class InsumoFormDialog implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(InsumoService);
  private toast = inject(ToastService);

  readonly insumo = input<InsumoListItem | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  readonly saving = signal(false);
  readonly categorias = signal<string[]>([]);

  readonly NUEVA_CATEGORIA = NUEVA_CATEGORIA;

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    categoria: ['general', Validators.required],
    categoriaNueva: [''],
    unidad_medida: ['kg', Validators.required],
    precio_unitario: [0, [Validators.required, Validators.min(0)]],
    stock_minimo: [0, Validators.min(0)],
    stock_critico: [0, Validators.min(0)],
    razon_cambio_precio: [''],
  });

  ngOnInit() {
    this.service.categorias().subscribe((res) => {
      const cats = res.data;
      const actual = this.insumo()?.categoria;
      this.categorias.set(actual && !cats.includes(actual) ? [...cats, actual] : cats);
    });

    const i = this.insumo();
    if (i) {
      this.form.patchValue({
        codigo: i.codigo,
        nombre: i.nombre,
        categoria: i.categoria,
        unidad_medida: i.unidad_medida,
        precio_unitario: Number(i.precio_unitario),
        stock_minimo: Number(i.stock_minimo),
        stock_critico: Number(i.stock_critico),
      });
      this.form.get('codigo')!.disable();
    }
  }

  precioCambio(): boolean {
    const i = this.insumo();
    if (!i) return false;
    return Number(this.form.value.precio_unitario) !== Number(i.precio_unitario);
  }

  guardar() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const categoria = v.categoria === NUEVA_CATEGORIA ? v.categoriaNueva.trim() : v.categoria;
    if (!categoria) {
      this.toast.error('Ingresá el nombre de la nueva categoría');
      return;
    }

    this.saving.set(true);
    const i = this.insumo();

    if (i) {
      const payload: Record<string, unknown> = {
        nombre: v.nombre,
        categoria,
        unidad_medida: v.unidad_medida,
        precio_unitario: v.precio_unitario,
        stock_minimo: v.stock_minimo,
        stock_critico: v.stock_critico,
      };
      if (v.razon_cambio_precio) payload['razon_cambio_precio'] = v.razon_cambio_precio;
      this.service.actualizar(i.id, payload).subscribe({
        next: () => {
          this.toast.success('Insumo actualizado');
          this.saved.emit();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.service
        .crear({
          codigo: v.codigo,
          nombre: v.nombre,
          categoria,
          unidad_medida: v.unidad_medida,
          precio_unitario: v.precio_unitario,
          stock_minimo: v.stock_minimo,
          stock_critico: v.stock_critico,
        })
        .subscribe({
          next: () => {
            this.toast.success('Insumo creado');
            this.saved.emit();
          },
          error: () => this.saving.set(false),
        });
    }
  }
}
