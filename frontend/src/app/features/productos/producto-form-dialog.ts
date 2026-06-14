import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductosService } from '../../core/services/productos.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';
import { Producto } from '../../core/services/produccion.service';

const NUEVA_CATEGORIA = '__nueva__';

@Component({
  selector: 'app-producto-form-dialog',
  imports: [ReactiveFormsModule, Modal],
  template: `
    <app-modal [title]="producto() ? 'Editar producto' : 'Nuevo producto'" [wide]="true" (closed)="closed.emit()">
      <form [formGroup]="form" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Código</label>
          <input class="input" formControlName="codigo" placeholder="PROD-006" />
        </div>
        <div>
          <label class="label">Nombre</label>
          <input class="input" formControlName="nombre" />
        </div>
        <div>
          <label class="label">Categoría</label>
          <select class="select" formControlName="categoria">
            <option value="" disabled>Seleccionar categoría…</option>
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
          <label class="label">Peso (gramos)</label>
          <input class="input" type="number" formControlName="peso_gramos" min="0" step="any" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Descripción</label>
          <textarea class="textarea" rows="2" formControlName="descripcion"></textarea>
        </div>

        <div class="sm:col-span-2">
          <p class="label mb-1">Listas de precios</p>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label class="label text-xs">Precio de venta</label>
              <input class="input" type="number" formControlName="precio_venta" min="0" step="any" />
            </div>
            <div>
              <label class="label text-xs">Mayorista</label>
              <input class="input" type="number" formControlName="precio_mayorista" min="0" step="any" />
            </div>
            <div>
              <label class="label text-xs">Revendedor</label>
              <input class="input" type="number" formControlName="precio_revendedor" min="0" step="any" />
            </div>
            <div>
              <label class="label text-xs">Comercio</label>
              <input class="input" type="number" formControlName="precio_comercio" min="0" step="any" />
            </div>
            <div>
              <label class="label text-xs">Público</label>
              <input class="input" type="number" formControlName="precio_publico" min="0" step="any" />
            </div>
          </div>
        </div>
      </form>

      <div modal-footer>
        <button class="btn btn-ghost" (click)="closed.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="guardar()">
          {{ producto() ? 'Guardar cambios' : 'Crear' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class ProductoFormDialog implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ProductosService);
  private toast = inject(ToastService);

  readonly producto = input<Producto | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  readonly saving = signal(false);
  readonly categorias = signal<string[]>([]);

  readonly NUEVA_CATEGORIA = NUEVA_CATEGORIA;

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    categoria: ['', Validators.required],
    categoriaNueva: [''],
    peso_gramos: [null as number | null, Validators.min(0)],
    descripcion: [''],
    precio_venta: [null as number | null, Validators.min(0)],
    precio_mayorista: [null as number | null, Validators.min(0)],
    precio_revendedor: [null as number | null, Validators.min(0)],
    precio_comercio: [null as number | null, Validators.min(0)],
    precio_publico: [null as number | null, Validators.min(0)],
  });

  ngOnInit() {
    this.service.categorias().subscribe((res) => {
      const cats = res.data;
      const actual = this.producto()?.categoria;
      this.categorias.set(actual && !cats.includes(actual) ? [...cats, actual] : cats);
    });

    const p = this.producto();
    if (p) {
      this.form.patchValue({
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        peso_gramos: p.pesoGramos,
        descripcion: p.descripcion ?? '',
        precio_venta: p.precioVenta != null ? Number(p.precioVenta) : null,
        precio_mayorista: p.precioMayorista != null ? Number(p.precioMayorista) : null,
        precio_revendedor: p.precioRevendedor != null ? Number(p.precioRevendedor) : null,
        precio_comercio: p.precioComercio != null ? Number(p.precioComercio) : null,
        precio_publico: p.precioPublico != null ? Number(p.precioPublico) : null,
      });
      this.form.get('codigo')!.disable();
    }
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
    const p = this.producto();

    const payload = {
      nombre: v.nombre,
      categoria,
      descripcion: v.descripcion.trim() || undefined,
      peso_gramos: v.peso_gramos ?? undefined,
      precio_venta: v.precio_venta ?? undefined,
      precio_mayorista: v.precio_mayorista ?? undefined,
      precio_revendedor: v.precio_revendedor ?? undefined,
      precio_comercio: v.precio_comercio ?? undefined,
      precio_publico: v.precio_publico ?? undefined,
    };

    if (p) {
      this.service.actualizar(p.id, payload).subscribe({
        next: () => {
          this.toast.success('Producto actualizado');
          this.saved.emit();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.service.crear({ codigo: v.codigo, ...payload }).subscribe({
        next: () => {
          this.toast.success('Producto creado');
          this.saved.emit();
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
